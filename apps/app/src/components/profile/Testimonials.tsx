import Rating from "@/components/common/Rating";
import { useProfileContext } from "@/providers/profile";
import * as Chakra from "@chakra-ui/react";

export default function Testimonials() {
  const profile = useProfileContext();

  if (profile === undefined) return <></>;

  return (
    <Chakra.SimpleGrid columns={1} spacing={10}>
      {profile.testimonials.length > 0 &&
        profile.testimonials.map((testimonial) => (
          <Chakra.Box key={testimonial.id}>
            <Chakra.Stack
              spacing={5}
              direction={{ base: "column", md: "row" }}
              align={{ base: "center", md: "start" }}
            >
              <Chakra.Avatar
                src={testimonial.avatar || ""}
                size={{ base: "xl", md: "lg" }}
                name={testimonial.name}
              />
              <Chakra.VStack align={{ base: "center", md: "start" }}>
                <Chakra.VStack align={{ base: "center", md: "start" }}>
                  <Chakra.Heading
                    fontFamily={profile.theme.font.style.fontFamily}
                    fontSize={{ base: "md", md: "lg" }}
                    textAlign="center"
                  >
                    {testimonial.name}
                  </Chakra.Heading>
                  <Chakra.Text
                    textAlign="start"
                    fontSize={{ base: "sm", md: "md" }}
                    whiteSpace="pre-wrap"
                  >
                    {testimonial.message}
                  </Chakra.Text>
                </Chakra.VStack>
                <Rating rating={testimonial.rating} starDimension="20px" starSpacing="2px" />
              </Chakra.VStack>
            </Chakra.Stack>
          </Chakra.Box>
        ))}
    </Chakra.SimpleGrid>
  );
}