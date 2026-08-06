import { Box, Flex, useDisclosure } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

/** Shell around authenticated pages: sidebar + top bar + page outlet. */
export function AppLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
  }, [location.pathname, location.search])

  return (
    <Flex h="100vh" maxH="100vh" overflow="hidden" bg="chrome.bg">
      <Sidebar isOpen={isOpen} onClose={onClose} />
      <Flex direction="column" flex="1" minW={0} minH={0} overflow="hidden" bg="chrome.bg">
        <Navbar onOpenSidebar={onOpen} />
        <Box
          ref={mainRef}
          as="main"
          flex="1"
          minH={0}
          minW={0}
          overflowY="auto"
          overflowX="hidden"
          bg="cyber.bg"
          px={{ base: 3, sm: 4, md: 6, xl: 8 }}
          pt={{ base: 3, md: 6, xl: 8 }}
          pb={{ base: 10, md: 12, xl: 14 }}
        >
          <Box maxW="1400px" w="full" minW={0} mx="auto">
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Flex>
  )
}
