import { AppLayout } from "@/Layouts/app";
import type { NextPageWithLayout } from "@/pages/_app";
import { getServerAuthSession, requireAuth } from "@/server/auth";
import {
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
} from "@chakra-ui/react";
import { Icon } from "components";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useForm } from "react-hook-form";

const settingsSchema = z.object({
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  socialIconPlacement: z.enum(["TOP", "BOTTOM"]),
});

type SettingsSchema = z.infer<typeof settingsSchema>;

const SettingsPage: NextPageWithLayout<{ settings: Settings }> = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const { settings } = props;
  const [isProcessing, setProcessing] = React.useState(false);
  const { register, handleSubmit } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    values: {
      ...settings,
    },
  });
  const toast = useToast();
  const previewContext = usePreviewContext();
  const onSubmit = async (values: SettingsSchema) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        return toast({ status: "error", description: data.message });
      }
      previewContext?.reload();
      toast({ status: "success", description: data.message });
    } catch (err) {
      if (err instanceof Error) {
        toast({ status: "error", description: err.message });
      }
    } finally {
      setProcessing(false);
    }
  };
  return (
    <VStack maxW="2xl" w="full" align="start">
      <Card w="full" bg="white" size="lg">
        <CardBody>
          <VStack spacing="5" as="form" onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
              <FormLabel>SEO Title</FormLabel>
              <Input {...register("seoTitle")} />
            </FormControl>
            <FormControl>
              <FormLabel>SEO Description</FormLabel>
              <Input {...register("seoDescription")} />
            </FormControl>
            <FormControl>
              <FormLabel>Social links position</FormLabel>
              <Select {...register("socialIconPlacement")}>
                <option value="TOP">Top</option>
                <option value="BOTTOM">Bottom</option>
              </Select>
            </FormControl>
            <Button
              type="submit"
              isLoading={isProcessing}
              colorScheme="purple"
              leftIcon={<Icon name="Save" />}
              w="full"
            >
              Save changes
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

SettingsPage.getLayout = (page) => {
  return <AppLayout>{page}</AppLayout>;
};

export default SettingsPage;

import { usePreviewContext } from "@/providers/preview";
import { prisma } from "@/server/db";
import { useToast } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { z } from "zod";

export type Settings = {
  seoTitle?: string;
  seoDescription?: string;
  socialIconPlacement: "TOP" | "BOTTOM";
};

export const getServerSideProps: GetServerSideProps = requireAuth(async (ctx) => {
  const session = await getServerAuthSession(ctx);

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: {
      username: true,
      bio: true,
      settings: true,
    },
  });

  if (!user?.username || !user?.bio) {
    return {
      redirect: { destination: "/auth/onboarding", permanent: false },
    };
  }

  const { settings } = user;

  return {
    props: { settings },
  };
});
