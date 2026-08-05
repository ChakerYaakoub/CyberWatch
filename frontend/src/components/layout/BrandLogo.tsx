import { Box, Text } from '@chakra-ui/react'

interface BrandLogoProps {
  compact?: boolean
}

/** Split logo inspired by AlgoSecure: first half green, second half white/text */
export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <Box lineHeight="1.1">
      <Text
        fontFamily="heading"
        fontWeight="800"
        fontSize={compact ? 'lg' : 'xl'}
        letterSpacing="-0.02em"
        textTransform="lowercase"
      >
        <Text as="span" color="brand.500">
          cyber
        </Text>
        <Text as="span" color="chrome.text">
          watch
        </Text>
      </Text>
      {!compact ? (
        <Text
          fontSize="9px"
          color="chrome.muted"
          textTransform="uppercase"
          letterSpacing="0.14em"
          mt={1}
          fontWeight="500"
        >
          Keep it safe and secure
        </Text>
      ) : null}
    </Box>
  )
}
