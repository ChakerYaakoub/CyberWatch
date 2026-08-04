import {
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { formatDate, LoadingState } from '../components/common/PageStates'
import { StatusBadge } from '../components/common/StatusBadge'
import { useCompanies, useCreateCompany } from '../hooks/useApi'

export function Companies() {
  const { data: companies, isLoading } = useCompanies()
  const createCompany = useCreateCompany()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')

  function resetForm() {
    setName('')
    setDomain('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await createCompany.mutateAsync({ name: name.trim(), domain: domain.trim() })
      toast({
        title: 'Company added',
        description: `${name} is now pending monitoring.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      handleClose()
    } catch {
      toast({
        title: 'Unable to add company',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading companies…" />
  }

  return (
    <VStack align="stretch" spacing={6}>
      <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={3}>
        <Stack spacing={1}>
          <Heading size="lg" letterSpacing="tight">
            Companies
          </Heading>
          <Text color="cyber.muted" fontSize="sm">
            Manage organizations monitored by CyberWatch
          </Text>
        </Stack>
        <Button onClick={onOpen}>Add Company</Button>
      </Flex>

      <Card>
        <CardBody>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Domain</Th>
                  <Th>Created date</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(companies ?? []).map((company) => (
                  <Tr key={company.id} _hover={{ bg: 'whiteAlpha.50' }}>
                    <Td fontWeight="600">{company.name}</Td>
                    <Td fontFamily="mono" fontSize="sm" color="cyber.muted">
                      {company.domain}
                    </Td>
                    <Td fontFamily="mono" fontSize="sm">
                      {formatDate(company.createdAt)}
                    </Td>
                    <Td>
                      <StatusBadge status={company.status} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>Add Company</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="cyber.muted">
                  Company name
                </FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corporation"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="cyber.muted">
                  Domain
                </FormLabel>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme.com"
                  fontFamily="mono"
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCompany.isPending}>
              Add Company
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
