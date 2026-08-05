import { IconButton } from '@chakra-ui/react'
import { useColorMode } from '@chakra-ui/react'

export function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()
  const isLight = colorMode === 'light'

  return (
    <IconButton
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Dark mode' : 'Light mode'}
      variant="ghost"
      size="sm"
      color="chrome.text"
      _hover={{ bg: 'chrome.hover' }}
      onClick={toggleColorMode}
      icon={
        <span style={{ fontSize: '1.15rem', lineHeight: 1 }} aria-hidden>
          {isLight ? '☾' : '☀'}
        </span>
      }
    />
  )
}
