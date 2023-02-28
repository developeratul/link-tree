import { SectionLoader } from "@/components/common/Loader";
import { EmptyMessage, ErrorMessage } from "@/components/common/Message";
import SectionWrapper from "@/components/common/SectionWrapper";
import { usePreviewContext } from "@/providers/preview";
import { api } from "@/utils/api";
import * as Chakra from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { TRPCClientError } from "@trpc/client";
import type { OnDragEndResponder } from "react-beautiful-dnd";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import CreateSectionModal from "./CreateSectionModal";
import Section from "./Section";

export default function Sections() {
  const previewContext = usePreviewContext();
  const { data, isLoading, isError, error } = api.section.getWithLinks.useQuery();
  const { mutateAsync } = api.section.reorder.useMutation();
  const utils = api.useContext();
  const toast = useToast();

  const handleDragEnd: OnDragEndResponder = async (result) => {
    try {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const items = data;
      const item = items?.find((group) => group.id === draggableId);
      if (item) {
        items?.splice(source.index, 1);
        items?.splice(destination.index, 0, item);

        await mutateAsync({
          newOrder: items?.map((item) => item.id) as string[],
        });
        await utils.section.getWithLinks.invalidate();
        previewContext?.reload();
      }
    } catch (err) {
      if (err instanceof TRPCClientError) {
        toast({ status: "error", description: err.message });
      }
    }
  };

  if (isLoading) return <SectionLoader />;
  if (isError) return <ErrorMessage description={error.message} />;
  if (!data?.length)
    return (
      <EmptyMessage
        title="No groups created"
        description="Groups are sections which will contain and display your links."
        createButton={<CreateSectionModal />}
      />
    );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <SectionWrapper title="Groups" cta={<CreateSectionModal />}>
        <Droppable droppableId="group-droppable">
          {(provided) => (
            <Chakra.VStack {...provided.droppableProps} ref={provided.innerRef} w="full" spacing="4">
              {data.map((section, index) => (
                <Section section={section} index={index} key={section.id} />
              ))}
              {provided.placeholder}
            </Chakra.VStack>
          )}
        </Droppable>
      </SectionWrapper>
    </DragDropContext>
  );
}