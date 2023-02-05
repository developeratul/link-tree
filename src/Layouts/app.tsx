import AppBar from "@/components/app/AppBar";
import { SEO } from "@/components/common/SEO";
import { PreviewPanel, PreviewProvider } from "@/providers/preview";
import type { AppProps } from "@/types";
import * as Chakra from "@chakra-ui/react";

export function AppLayout(props: AppProps) {
  const { children } = props;
  return (
    <Chakra.Box className="h-full w-full overflow-x-hidden" bg="gray.100">
      <SEO
        title="App"
        description="The LinkVault editor where your page is customized"
      />
      <AppBar />
      <Chakra.HStack w="full" align="start">
        <PreviewProvider>
          <Chakra.Stack p={3} w="full" align="center">
            {children}
          </Chakra.Stack>
          <PreviewPanel />
        </PreviewProvider>
      </Chakra.HStack>
    </Chakra.Box>
  );
}
