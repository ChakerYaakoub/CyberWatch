import {
  Box,
  CloseButton,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Text,
  VStack,
} from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/companies', label: 'Companies', end: false },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <VStack align="stretch" spacing={1}>
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}>
          {({ isActive }) => (
            <Box
              px={3}
              py={2.5}
              borderRadius="md"
              fontSize="sm"
              fontWeight={isActive ? '600' : '500'}
              color={isActive ? 'brand.500' : 'cyber.muted'}
              bg={isActive ? 'whiteAlpha.100' : 'transparent'}
              borderLeftWidth="2px"
              borderLeftColor={isActive ? 'brand.500' : 'transparent'}
              _hover={{ bg: 'whiteAlpha.50', color: 'cyber.text' }}
              transition="all 0.15s ease"
            >
              {item.label}
            </Box>
          )}
        </NavLink>
      ))}
    </VStack>
  )
}

function SidebarBrand() {
  return (
    <Flex align="center" gap={3} mb={8} px={1}>
      <Box
        w="36px"
        h="36px"
        borderRadius="md"
        borderWidth="1px"
        borderColor="brand.500"
        bg="rgba(0, 212, 170, 0.12)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="brand.500" fontWeight="800" fontSize="sm" fontFamily="mono">
          CW
        </Text>
      </Box>
      <Box>
        <Text fontWeight="700" letterSpacing="tight" lineHeight="1.1">
          CyberWatch
        </Text>
        <Text fontSize="xs" color="cyber.muted" fontFamily="mono">
          SOC Console
        </Text>
      </Box>
    </Flex>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box h="full" py={6} px={4}>
      <SidebarBrand />
      <Text
        fontSize="xs"
        color="cyber.muted"
        textTransform="uppercase"
        letterSpacing="0.08em"
        mb={3}
        px={1}
      >
        Navigation
      </Text>
      <NavItems onNavigate={onNavigate} />
    </Box>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        w="260px"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="cyber.border"
        bg="cyber.panel"
        minH="100vh"
        position="sticky"
        top={0}
      >
        <SidebarContent />
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="cyber.panel" maxW="260px">
          <CloseButton position="absolute" right={3} top={3} onClick={onClose} />
          <DrawerBody p={0}>
            <SidebarContent onNavigate={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
