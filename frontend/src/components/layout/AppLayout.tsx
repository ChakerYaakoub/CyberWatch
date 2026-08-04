import { Box, Flex, useDisclosure } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Flex minH="100vh" bg="cyber.bg">
      <Sidebar isOpen={isOpen} onClose={onClose} />
      <Flex direction="column" flex="1" minW={0}>
        <Navbar onOpenSidebar={onOpen} />
        <Box
          as="main"
          flex="1"
          px={{ base: 4, md: 6, xl: 8 }}
          pt={{ base: 4, md: 6, xl: 8 }}
          pb={{ base: 10, md: 12, xl: 14 }}
          maxW="1400px"
          w="full"
          mx="auto"
        >
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  )
}
