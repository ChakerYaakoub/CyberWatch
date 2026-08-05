import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

/** CyberWatch brand — green + navy */
const colors = {
  brand: {
    50: '#F2F8E9',
    100: '#DCECBE',
    200: '#C5E094',
    300: '#A9D064',
    400: '#94C44A',
    500: '#80B942',
    600: '#6A9B34',
    700: '#547C29',
    800: '#3E5D1F',
    900: '#283E14',
  },
  navy: {
    50: '#E8EEF5',
    100: '#C5D2E3',
    200: '#9BB0C9',
    300: '#6F8EAF',
    400: '#4A6F96',
    500: '#2A517A',
    600: '#1A3A5C',
    700: '#12233A',
    800: '#0B1A2E',
    900: '#07101C',
  },
}

export const theme = extendTheme({
  config,
  colors,
  semanticTokens: {
    colors: {
      // Content area — lighter than chrome in dark mode so nav stays distinct
      'cyber.bg': { default: '#F8F8F8', _dark: '#152A42' },
      'cyber.panel': { default: '#FFFFFF', _dark: '#1B334D' },
      'cyber.panelAlt': { default: '#F3F3F3', _dark: '#203A56' },
      'cyber.border': { default: '#E5E5E5', _dark: '#2A517A' },
      'cyber.muted': { default: '#5A6570', _dark: '#9BB0C9' },
      'cyber.text': { default: '#333333', _dark: '#E8EEF5' },
      'cyber.accent': { default: 'brand.500', _dark: 'brand.400' },
      'cyber.danger': { default: '#E30613', _dark: '#FF4D57' },
      'cyber.warning': { default: '#D97706', _dark: '#FBBF24' },
      'cyber.info': { default: '#0284C7', _dark: '#38BDF8' },
      // Navbar / sidebar — deep navy chrome
      'chrome.bg': { default: 'navy.800', _dark: 'navy.800' },
      'chrome.text': { default: 'white', _dark: 'white' },
      'chrome.muted': { default: 'whiteAlpha.700', _dark: 'whiteAlpha.700' },
      'chrome.hover': { default: 'whiteAlpha.100', _dark: 'whiteAlpha.100' },
      'chrome.active': { default: 'whiteAlpha.200', _dark: 'whiteAlpha.200' },
    },
  },
  fonts: {
    heading: `'Montserrat', sans-serif`,
    body: `'Source Sans 3', sans-serif`,
    mono: `'JetBrains Mono', monospace`,
  },
  styles: {
    global: (props: { colorMode: string }) => ({
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
        background: props.colorMode === 'dark' ? '#152A42' : '#F8F8F8',
      },
      '::-webkit-scrollbar-thumb': {
        background: props.colorMode === 'dark' ? '#2A517A' : '#C5C5C5',
        borderRadius: '4px',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          fontWeight: '600',
          borderRadius: 'full',
          _hover: { bg: 'brand.600' },
          _active: { bg: 'brand.700' },
        },
        outline: {
          borderColor: 'cyber.border',
          color: 'cyber.text',
          borderRadius: 'full',
          _hover: { bg: 'cyber.panelAlt', borderColor: 'brand.400' },
        },
        ghost: {
          color: 'cyber.muted',
          borderRadius: 'full',
          _hover: { bg: 'blackAlpha.50', color: 'cyber.text', _dark: { bg: 'whiteAlpha.100' } },
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
          boxShadow: '0 1px 3px rgba(11, 26, 46, 0.06)',
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
            _hover: { bg: 'cyber.panel' },
            _focus: {
              bg: 'cyber.panel',
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px #80B942',
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
            bg: 'cyber.panelAlt',
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
          boxShadow: '0 12px 40px rgba(11, 26, 46, 0.16)',
        },
        header: { color: 'cyber.text' },
        body: { color: 'cyber.text' },
        overlay: { bg: 'blackAlpha.600' },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'cyber.panel',
          borderColor: 'cyber.border',
          boxShadow: '0 8px 24px rgba(11, 26, 46, 0.12)',
        },
        item: {
          bg: 'cyber.panel',
          color: 'cyber.text',
          _hover: { bg: 'cyber.panelAlt' },
          _focus: { bg: 'cyber.panelAlt' },
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            color: 'cyber.muted',
            _selected: {
              color: 'brand.600',
              borderColor: 'cyber.border',
              borderBottomColor: 'cyber.panel',
              bg: 'cyber.panel',
              fontWeight: '600',
            },
          },
          tablist: { borderColor: 'cyber.border' },
          tabpanel: { px: 0, pt: 4 },
        },
      },
    },
  },
})
