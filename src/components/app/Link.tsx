import { Icons } from "@/Icons";
import { api } from "@/utils/api";
import * as Chakra from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type Link = {
  id: string;
  icon?: string | null;
  text: string;
  url: string;
};

export type LinkProps = {
  link: Link;
};

export function Link(props: LinkProps) {
  const { link } = props;
  return (
    <Chakra.Card w="full" bg="white" size="lg">
      <Chakra.CardBody>
        <Chakra.Editable selectAllOnFocus={false} defaultValue={link.text}>
          <Chakra.EditablePreview
            as={Chakra.Heading}
            size="md"
            fontWeight="medium"
            cursor="pointer"
          />
          <Chakra.EditableInput />
        </Chakra.Editable>
        <Chakra.Editable selectAllOnFocus={false} defaultValue={link.url}>
          <Chakra.EditablePreview as={Chakra.Text} size="sm" cursor="pointer" />
          <Chakra.EditableInput />
        </Chakra.Editable>
      </Chakra.CardBody>
      <Chakra.CardFooter pt={0}>
        <Chakra.HStack w="full" justifyContent="space-between">
          <Chakra.HStack>
            <Chakra.IconButton icon={Icons.Icons} aria-label="Link icon" />
          </Chakra.HStack>
          <Chakra.IconButton
            colorScheme="red"
            icon={Icons.Delete}
            aria-label="Delete link"
          />
        </Chakra.HStack>
      </Chakra.CardFooter>
    </Chakra.Card>
  );
}

export type LinksProps = {
  links: Link[];
};

export default function Links(props: LinksProps) {
  const { links } = props;
  return (
    <>
      {links.map((link) => (
        <Link link={link} key={link.id} />
      ))}
    </>
  );
}

export const createLinkSchema = z.object({
  text: z.string().min(1, "Link text is required"),
  url: z.string().url("Invalid URL"),
});

export type CreateLinkSchema = z.infer<typeof createLinkSchema>;

export function CreateLinkModal(props: { groupId: string }) {
  const { groupId } = props;
  const { isOpen, onOpen, onClose } = Chakra.useDisclosure();
  const { formState, register, handleSubmit, reset } =
    useForm<CreateLinkSchema>({
      resolver: zodResolver(createLinkSchema),
    });
  const { mutateAsync, isLoading } = api.app.createLink.useMutation();
  const utils = api.useContext();
  const toast = useToast();

  const onSubmit = async (values: CreateLinkSchema) => {
    try {
      await mutateAsync({ ...values, groupId });
      await utils.app.getGroupsWithLinks.invalidate();
      onClose();
      reset();
    } catch (err) {
      if (err instanceof TRPCClientError) {
        toast({
          status: "error",
          title: "Application Error",
          description: err.message,
        });
      }
    }
  };

  return (
    <Chakra.Box w="full">
      <Chakra.Button
        onClick={onOpen}
        w="full"
        colorScheme="blue"
        leftIcon={Icons.Add}
      >
        Add new link
      </Chakra.Button>
      <Chakra.Modal isOpen={isOpen} onClose={onClose}>
        <Chakra.ModalOverlay />
        <Chakra.ModalContent>
          <Chakra.ModalHeader>Add link</Chakra.ModalHeader>
          <Chakra.ModalCloseButton />
          <Chakra.ModalBody>
            <Chakra.VStack
              as="form"
              id="add-link-form"
              onSubmit={handleSubmit(onSubmit)}
              w="full"
              spacing={5}
            >
              <Chakra.FormControl
                isRequired
                isInvalid={!!formState.errors.text}
              >
                <Chakra.FormLabel>Link text</Chakra.FormLabel>
                <Chakra.Input {...register("text")} />
                <Chakra.FormErrorMessage>
                  {formState.errors.text?.message}
                </Chakra.FormErrorMessage>
              </Chakra.FormControl>
              <Chakra.FormControl isRequired isInvalid={!!formState.errors.url}>
                <Chakra.FormLabel>Link URL</Chakra.FormLabel>
                <Chakra.Input {...register("url")} />
                <Chakra.FormErrorMessage>
                  {formState.errors.url?.message}
                </Chakra.FormErrorMessage>
              </Chakra.FormControl>
            </Chakra.VStack>
          </Chakra.ModalBody>
          <Chakra.ModalFooter>
            <Chakra.Button onClick={onClose} mr={3}>
              cancel
            </Chakra.Button>
            <Chakra.Button
              isLoading={isLoading}
              type="submit"
              form="add-link-form"
              colorScheme="purple"
              leftIcon={Icons.Add}
            >
              Add
            </Chakra.Button>
          </Chakra.ModalFooter>
        </Chakra.ModalContent>
      </Chakra.Modal>
    </Chakra.Box>
  );
}
