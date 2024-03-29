import { useProfileContext } from "@/providers/profile";
import type { ProfileLink, ProfileLinks } from "@/types";
import { api } from "@/utils/api";
import { getContrastColor } from "@/utils/color";
import { Box, HStack, Image, SimpleGrid, Text } from "@chakra-ui/react";
import { buttonImageRoundness, buttonVariantProps } from "../app/appearance/Button";

export default function Links(props: { links: ProfileLinks }) {
  const { links } = props;
  const profile = useProfileContext();

  if (profile === undefined) return <></>;

  return (
    <SimpleGrid columns={{ base: 1, md: profile.layout.linksColumnCount }} spacing="10px" w="full">
      {links.map((link) => (
        <Link key={link.id} link={link} />
      ))}
    </SimpleGrid>
  );
}

function Link(props: { link: ProfileLink }) {
  const { link } = props;
  const profile = useProfileContext();
  const { mutate } = api.analytics.captureLinkClick.useMutation();

  if (profile === undefined) return <></>;

  const handleLinkClick = async () => {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.click();
    mutate({ linkId: link.id, profileId: profile.id, userAgent: window.navigator.userAgent });
  };

  const isOutlinedButton = profile.button.buttonStyle.split("_").includes("OUTLINED");
  const buttonTextColor = isOutlinedButton
    ? profile.layout.layout === "CARD"
      ? getContrastColor(profile.theme.cardBackgroundColor)
      : getContrastColor(profile.theme.bodyBackgroundColor)
    : getContrastColor(profile.button.buttonBackground || (profile.theme.themeColor as string));

  return (
    <Box
      cursor="pointer"
      rounded="md"
      w="full"
      onClick={handleLinkClick}
      bg={profile.button.buttonBackground || profile.theme.themeColor}
      {...buttonVariantProps[profile.button.buttonStyle as string]}
      borderColor={profile.button.buttonBackground || profile.theme.themeColor}
      transition="100ms"
      transformOrigin="top"
      _hover={{
        transform: "scale(1.02)",
      }}
      px={2}
    >
      <HStack>
        {link.thumbnail && (
          <Image
            alt={link.text}
            objectFit="cover"
            rounded={buttonImageRoundness[profile.button.buttonStyle]}
            boxSize={{ base: "40px", sm: 45 }}
            src={link.thumbnail}
          />
        )}
        <Text
          fontSize={{ base: "sm", sm: "md" }}
          color={buttonTextColor}
          py={4}
          textAlign="center"
          w="full"
          fontWeight="medium"
        >
          {link.text}
        </Text>
      </HStack>
    </Box>
  );
}
