import { Profile } from "@/components/app/appearance/Profile";
import { AppLayout } from "@/Layouts/app";
import type { NextPageWithLayout } from "@/pages/_app";
import * as Chakra from "@chakra-ui/react";

const AppearancePage: NextPageWithLayout = () => {
  return (
    <Chakra.VStack w="full" maxW="2xl">
      <Profile />
    </Chakra.VStack>
  );
};

export default AppearancePage;
AppearancePage.getLayout = (page) => {
  return <AppLayout>{page}</AppLayout>;
};
export { getServerSideProps } from "./index";
