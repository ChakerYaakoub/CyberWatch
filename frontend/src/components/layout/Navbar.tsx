import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Badge,
} from '@chakra-ui/react'
import { useAuth } from '../../auth/useAuth'
import { BrandLogo } from './BrandLogo'
import { ColorModeToggle } from './ColorModeToggle'

interface NavbarProps {
  onOpenSidebar: () => void
}

export function Navbar({ onOpenSidebar }: NavbarProps) {
  const { user, logout, isAdmin } = useAuth()
  const primaryRole = isAdmin ? 'ADMIN' : (user?.roles[0] ?? 'USER')

  return (
    <Flex
      as="header"
      h="64px"
      align="center"
      justify="space-between"
      px={{ base: 4, md: 6 }}
      bg="chrome.bg"
      flexShrink={0}
      zIndex={10}
    >
      <HStack spacing={3}>
        <IconButton
          aria-label="Open menu"
          display={{ base: 'inline-flex', lg: 'none' }}
          variant="ghost"
          color="chrome.text"
          _hover={{ bg: 'chrome.hover' }}
          onClick={onOpenSidebar}
          icon={
            <Box as="span" fontSize="lg" lineHeight={1}>
              ☰
            </Box>
          }
        />
        <Box display={{ base: 'block', lg: 'none' }}>
          <BrandLogo compact />
        </Box>
        <Text display={{ base: 'none', md: 'block' }} color="chrome.muted" fontSize="sm">
          External Attack Surface Monitoring
        </Text>
      </HStack>

      <HStack spacing={2}>
        <ColorModeToggle />

        <Menu>
          <MenuButton>
            <HStack spacing={3} cursor="pointer">
              <Box textAlign="right" display={{ base: 'none', sm: 'block' }}>
                <Text fontSize="sm" fontWeight="600" color="chrome.text">
                  {user?.name ?? user?.email ?? 'User'}
                </Text>
                <HStack justify="flex-end" spacing={2}>
                  <Badge bg="brand.500" color="white" fontSize="0.65rem">
                    {primaryRole}
                  </Badge>
                  <Text fontSize="xs" color="chrome.muted">
                    {user?.email}
                  </Text>
                </HStack>
              </Box>
              <Avatar size="sm" name={user?.name ?? user?.email ?? 'CW'} bg="brand.500" color="white" />
            </HStack>
          </MenuButton>
          <MenuList bg="cyber.panel" borderColor="cyber.border">
            <MenuItem
              bg="cyber.panel"
              _hover={{ bg: 'cyber.panelAlt' }}
              onClick={() => {
                void logout()
              }}
            >
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  )
}
