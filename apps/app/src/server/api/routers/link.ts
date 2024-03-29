import { addLinkSchema } from "@/components/app/links/Links/AddLinkModal";
import { addThumbnailSchema } from "@/components/app/links/Links/AddThumbnail";
import { editLinkSchema } from "@/components/app/links/Links/EditLinkModal";
import { authorizeAuthor } from "@/helpers/auth";
import LinkService from "@/services/link";
import cloudinary from "@/utils/cloudinary";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const LinkSelections = {
  id: true,
  text: true,
  url: true,
  thumbnail: true,
  hidden: true,
} satisfies Prisma.LinkSelect;

export const linkRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      addLinkSchema.extend({
        sectionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sectionId, text, url } = input;

      const previousLink = await LinkService.findPrevious(sectionId);

      let link;

      if (previousLink) {
        link = await ctx.prisma.link.create({
          data: {
            text,
            url,
            sectionId,
            userId: ctx.session.user.id,
            index: previousLink.index + 1,
          },
          select: LinkSelections,
        });
      } else {
        link = await ctx.prisma.link.create({
          data: {
            text,
            url,
            sectionId,
            userId: ctx.session.user.id,
            index: 0,
          },
          select: LinkSelections,
        });
      }

      return link;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const linkId = input;

    const link = await ctx.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true, sectionId: true },
    });

    if (!link) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Link not found",
      });
    }

    authorizeAuthor(link?.userId, ctx.session.user.id);

    const deletedLink = await ctx.prisma.link.delete({
      where: { id: linkId },
      select: LinkSelections,
    });

    // update the order of current links
    const updatedLinksList = await LinkService.findMany(link.sectionId);
    updatedLinksList.map(async (item, index) => {
      await ctx.prisma.link.update({
        where: { id: item.id },
        data: { index },
      });
    });

    return deletedLink;
  }),

  edit: protectedProcedure
    .input(editLinkSchema.extend({ linkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { linkId, ...update } = input;

      const link = await ctx.prisma.link.findUnique({
        where: { id: linkId },
        select: { userId: true },
      });

      if (!link) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Link not found",
        });
      }

      authorizeAuthor(link.userId, ctx.session.user.id);

      const updatedLink = await ctx.prisma.link.update({
        where: { id: linkId },
        data: { ...update },
        select: LinkSelections,
      });

      return updatedLink;
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        newOrder: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { newOrder } = input;

      for (const linkId of newOrder) {
        const link = await ctx.prisma.link.findUnique({
          where: { id: linkId },
          select: { userId: true },
        });

        if (!link) throw new TRPCError({ code: "NOT_FOUND" });

        authorizeAuthor(link.userId, ctx.session.user.id);

        await ctx.prisma.link.update({
          where: { id: linkId },
          data: { index: newOrder.indexOf(linkId) },
        });
      }

      return;
    }),

  addThumbnail: protectedProcedure
    .input(addThumbnailSchema.extend({ linkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { linkId, url, publicId } = input;

      const link = await ctx.prisma.link.findUnique({
        where: { id: linkId },
        select: { userId: true, thumbnail: true, thumbnailPublicId: true },
      });

      if (!link) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      authorizeAuthor(link.userId, ctx.session.user.id);

      // if we have a previously uploaded thumbnail through cloudinary, then delete it first
      if (link.thumbnail && link.thumbnailPublicId) {
        await cloudinary.uploader.destroy(link.thumbnailPublicId);
      }

      const updatedLink = await ctx.prisma.link.update({
        where: { id: linkId },
        data: { thumbnail: url, thumbnailPublicId: publicId },
        select: LinkSelections,
      });

      return updatedLink;
    }),

  removeThumbnail: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const linkId = input;

    const link = await ctx.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true, thumbnail: true, thumbnailPublicId: true },
    });

    if (!link) {
      throw new TRPCError({
        code: "NOT_FOUND",
      });
    }

    authorizeAuthor(link.userId, ctx.session.user.id);

    if (link.thumbnail && link.thumbnailPublicId) {
      await cloudinary.uploader.destroy(link.thumbnailPublicId);
    }

    const updatedLink = await ctx.prisma.link.update({
      where: { id: linkId },
      data: { thumbnail: null, thumbnailPublicId: null },
    });

    return updatedLink;
  }),
});
