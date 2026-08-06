import { Icon, IconButton, useColorMode } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

function SunIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </Icon>
  )
}

function MoonIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21 14.3A9 9 0 1 1 9.7 3a7 7 0 1 0 11.3 11.3Z" />
    </Icon>
  )
}

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
      icon={isLight ? <MoonIcon boxSize={5} /> : <SunIcon boxSize={5} />}
    />
  )
}
