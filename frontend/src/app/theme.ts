import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const colors = {
  brand: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#00D4AA',
    600: '#00B894',
    700: '#009B7A',
    800: '#007A5E',
    900: '#005C47',
  },
  cyber: {
    bg: '#0B1220',
    panel: '#111827',
    panelAlt: '#151E2E',
    border: '#1E293B',
    muted: '#94A3B8',
    text: '#E2E8F0',
    accent: '#00D4AA',
    danger: '#F43F5E',
    warning: '#F59E0B',
    info: '#38BDF8',
  },
}

export const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: `'IBM Plex Sans', sans-serif`,
    body: `'IBM Plex Sans', sans-serif`,
    mono: `'JetBrains Mono', monospace`,
  },
  styles: {
    global: {
      body: {
        bg: 'cyber.bg',
        color: 'cyber.text',
        minHeight: '100vh',
      },
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        background: '#0B1220',
      },
      '::-webkit-scrollbar-thumb': {
        background: '#1E293B',
        borderRadius: '4px',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'gray.900',
          fontWeight: '600',
          _hover: { bg: 'brand.400' },
        },
        outline: {
          borderColor: 'cyber.border',
          color: 'cyber.text',
          _hover: { bg: 'cyber.panelAlt' },
        },
        ghost: {
          color: 'cyber.muted',
          _hover: { bg: 'cyber.panelAlt', color: 'cyber.text' },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'cyber.panel',
          borderWidth: '1px',
          borderColor: 'cyber.border',
          borderRadius: 'lg',
          boxShadow: 'none',
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'cyber.panelAlt',
            borderColor: 'cyber.border',
            borderWidth: '1px',
            color: 'cyber.text',
            _hover: { bg: 'cyber.panelAlt' },
            _focus: {
              bg: 'cyber.panelAlt',
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px #00D4AA',
            },
            _placeholder: { color: 'cyber.muted' },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'cyber.border',
            color: 'cyber.muted',
            fontSize: 'xs',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: '600',
          },
          td: {
            borderColor: 'cyber.border',
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'cyber.panel',
          borderWidth: '1px',
          borderColor: 'cyber.border',
        },
        header: {
          color: 'cyber.text',
        },
        body: {
          color: 'cyber.text',
        },
        overlay: {
          bg: 'blackAlpha.700',
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            color: 'cyber.muted',
            _selected: {
              color: 'brand.500',
              borderColor: 'cyber.border',
              borderBottomColor: 'cyber.panel',
              bg: 'cyber.panel',
            },
          },
          tablist: {
            borderColor: 'cyber.border',
          },
          tabpanel: {
            px: 0,
            pt: 4,
          },
        },
      },
    },
  },
})
