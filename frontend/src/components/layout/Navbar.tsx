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
} from '@chakra-ui/react'
import { useAuth } from '../../hooks/useAuth'

interface NavbarProps {
  onOpenSidebar: () => void
}

export function Navbar({ onOpenSidebar }: NavbarProps) {
  const { user, logout } = useAuth()

  return (
    <Flex
      as="header"
      h="64px"
      align="center"
      justify="space-between"
      px={{ base: 4, md: 6 }}
      borderBottomWidth="1px"
      borderColor="cyber.border"
      bg="cyber.panel"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <HStack spacing={3}>
        <IconButton
          aria-label="Open menu"
          display={{ base: 'inline-flex', lg: 'none' }}
          variant="ghost"
          onClick={onOpenSidebar}
          icon={
            <Box as="span" fontSize="lg" lineHeight={1}>
              ☰
            </Box>
          }
        />
        <Box display={{ base: 'block', lg: 'none' }}>
          <Text fontWeight="700" color="brand.500" letterSpacing="tight">
            CyberWatch
          </Text>
        </Box>
        <Text display={{ base: 'none', md: 'block' }} color="cyber.muted" fontSize="sm">
          External Attack Surface Monitoring
        </Text>
      </HStack>

      <Menu>
        <MenuButton>
          <HStack spacing={3} cursor="pointer">
            <Box textAlign="right" display={{ base: 'none', sm: 'block' }}>
              <Text fontSize="sm" fontWeight="600">
                {user?.email ?? 'Analyst'}
              </Text>
              <Text fontSize="xs" color="cyber.muted">
                Security Analyst
              </Text>
            </Box>
            <Avatar size="sm" name={user?.email ?? 'CW'} bg="brand.500" color="gray.900" />
          </HStack>
        </MenuButton>
        <MenuList bg="cyber.panel" borderColor="cyber.border">
          <MenuItem bg="cyber.panel" _hover={{ bg: 'cyber.panelAlt' }} onClick={logout}>
            Sign out
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  )
}
