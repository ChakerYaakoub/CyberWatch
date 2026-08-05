import {
  Box,
  CloseButton,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Text,
  VStack,
} from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'

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
              color={isActive ? 'brand.500' : 'chrome.muted'}
              bg={isActive ? 'chrome.active' : 'transparent'}
              borderLeftWidth="2px"
              borderLeftColor={isActive ? 'brand.500' : 'transparent'}
              _hover={{ bg: 'chrome.hover', color: 'chrome.text' }}
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box h="full" py={6} px={4}>
      <Box mb={8} px={1}>
        <BrandLogo />
      </Box>
      <Text
        fontSize="xs"
        color="chrome.muted"
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
        bg="chrome.bg"
        h="100vh"
        overflowY="auto"
      >
        <SidebarContent />
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="chrome.bg" maxW="260px">
          <CloseButton position="absolute" right={3} top={3} color="chrome.text" onClick={onClose} />
          <DrawerBody p={0}>
            <SidebarContent onNavigate={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
