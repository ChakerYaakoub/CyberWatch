import { Box, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

interface BrandLogoProps {
  compact?: boolean
}

/** Split logo: first half green, second half white/text — always links to Home. */
export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <Box
      as={RouterLink}
      to="/"
      lineHeight="1.1"
      display="inline-block"
      _hover={{ opacity: 0.9 }}
      aria-label="CyberWatch home"
    >
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
