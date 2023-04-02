import { Conditional } from "@/components/common/Conditional";
import { usePreviewContext } from "@/providers/preview";
import type { Link } from "@/types";
import { api } from "@/utils/api";
import uploadFile from "@/utils/uploadFile";
import * as Chakra from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { TRPCClientError } from "@trpc/client";
import { AxiosError } from "axios";
import type { ChangeEvent } from "react";
import React from "react";
import * as z from "zod";
import { RemoveThumbnail } from "./RemoveThumbnail";

export const addThumbnailSchema = z.object({
  url: z.string().url("Invalid URL"),
  publicId: z.string().optional(),
});

export function AddThumbnail(props: { link: Link; children: React.ReactNode }) {
  const previewContext = usePreviewContext();
  const {
    link: { id: linkId, thumbnail },
    children,
  } = props;
  const { mutateAsync } = api.link.addThumbnail.useMutation();
  const [isLoading, setLoading] = React.useState(false);
  const [isEditingThumbnail, setEditingThumbnail] = React.useState(!!!thumbnail);
  const [file, setFile] = React.useState<Blob | null>();
  const [url, setUrl] = React.useState<string>("");
  const { isOpen, onClose, onOpen } = Chakra.useDisclosure();
  const toast = useToast();
  const utils = api.useContext();

  const closePopover = (resetEditing = true) => {
    onClose();
    setTimeout(() => {
      setFile(null);
      setUrl("");
      if (resetEditing) {
        setEditingThumbnail(!!!thumbnail);
      }
    }, 100);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (url) {
        setUrl("");
      }
    }
  };

  const handleUrlInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (file) {
      setFile(null);
    }
  };

  const handleSave = async () => {
    if (!file && !url) return;
    if (url && !z.string().url().safeParse(url).success) {
      return toast({
        status: "error",
        description: "Invalid URL",
      });
    }
    setLoading(true);
    try {
      if (file) {
        const { secure_url, public_id } = await uploadFile(file);
        await mutateAsync({ linkId, publicId: public_id, url: secure_url });
      } else {
        await mutateAsync({ linkId, url });
      }

      await utils.section.getWithLinks.invalidate();
      previewContext?.reload();
      closePopover(false);
      setFile(null);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast({
          status: "error",
          description: err.response?.data.message || err.message,
        });
      } else if (err instanceof TRPCClientError) {
        toast({
          status: "error",
          description: err.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setEditingThumbnail(!!!thumbnail);
  }, [thumbnail]);

  return (
    <Chakra.Popover onOpen={onOpen} isOpen={isOpen} onClose={closePopover}>
      <Chakra.PopoverTrigger>{children}</Chakra.PopoverTrigger>
      <Chakra.PopoverContent>
        <Chakra.PopoverArrow />
        <Chakra.PopoverCloseButton />
        <Chakra.PopoverHeader>Thumbnail</Chakra.PopoverHeader>
        <Chakra.PopoverBody>
          {isEditingThumbnail ? (
            <Chakra.VStack>
              <Chakra.FormControl>
                <Chakra.FormLabel>Enter public URL</Chakra.FormLabel>
                <Chakra.Input size="sm" onChange={handleUrlInputChange} name="url" value={url} />
              </Chakra.FormControl>
              <Chakra.Text py={1} fontWeight="medium">
                or
              </Chakra.Text>
              <Chakra.FormControl>
                <Chakra.FormLabel>Upload File</Chakra.FormLabel>
                <Chakra.Input
                  onChange={handleFileInputChange}
                  name="file"
                  size="sm"
                  type="file"
                  accept="image/jpeg, image/png, image/gif, image/svg+xml"
                />
              </Chakra.FormControl>
            </Chakra.VStack>
          ) : (
            <Chakra.Box>
              <Conditional
                condition={!!thumbnail}
                component={<Chakra.Image src={thumbnail as string} alt={thumbnail as string} />}
                fallback={
                  <Chakra.Text textAlign="center" py={5} color="GrayText" fontWeight="medium">
                    No thumbnail
                  </Chakra.Text>
                }
              />
            </Chakra.Box>
          )}
        </Chakra.PopoverBody>
        <Chakra.PopoverFooter>
          <Conditional
            condition={isEditingThumbnail}
            component={
              <Chakra.Button
                w="full"
                size="sm"
                colorScheme="purple"
                onClick={handleSave}
                isLoading={isLoading}
              >
                Save
              </Chakra.Button>
            }
            fallback={
              <Chakra.HStack>
                <Chakra.Button
                  onClick={() => setEditingThumbnail(true)}
                  size="sm"
                  colorScheme="purple"
                >
                  Edit
                </Chakra.Button>
                <RemoveThumbnail linkId={linkId} />
              </Chakra.HStack>
            }
          />
        </Chakra.PopoverFooter>
      </Chakra.PopoverContent>
    </Chakra.Popover>
  );
}