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
import { EmptyState, ErrorState, formatDate, LoadingState } from '../components/common/PageStates'
import { StatusBadge } from '../components/common/StatusBadge'
import { useCompanies, useCreateCompany } from '../hooks/useCompanies'
import { useCreateScan } from '../hooks/useScans'
import { getErrorMessage } from '../services/api'

export function Companies() {
  const { data: companies, isLoading, error } = useCompanies()
  const createCompany = useCreateCompany()
  const createScan = useCreateScan()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [startingCompanyId, setStartingCompanyId] = useState<number | null>(null)

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
        description: `${name} was created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      handleClose()
    } catch (err) {
      toast({
        title: 'Unable to add company',
        description: getErrorMessage(err),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  async function handleStartScan(companyId: number, companyName: string) {
    setStartingCompanyId(companyId)
    try {
      const scan = await createScan.mutateAsync(companyId)
      toast({
        title: 'Scan started',
        description: `${companyName} scan is ${scan.status}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Unable to start scan',
        description: getErrorMessage(err),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setStartingCompanyId(null)
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading companies…" />
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} />
  }

  return (
    <VStack align="stretch" spacing={6}>
      <Flex
        justify="space-between"
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
      >
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
          {!companies || companies.length === 0 ? (
            <EmptyState title="No companies yet" description="Add a company to start monitoring its attack surface." />
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Domain</Th>
                    <Th>Created date</Th>
                    <Th>Status</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {companies.map((company) => (
                    <Tr key={company.id} _hover={{ bg: 'whiteAlpha.50' }}>
                      <Td fontWeight="600">{company.name}</Td>
                      <Td fontFamily="mono" fontSize="sm" color="cyber.muted">
                        {company.domain}
                      </Td>
                      <Td fontFamily="mono" fontSize="sm">
                        {formatDate(company.createdAt)}
                      </Td>
                      <Td>
                        <StatusBadge status="Active" />
                      </Td>
                      <Td textAlign="right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => void handleStartScan(company.id, company.name)}
                          isLoading={startingCompanyId === company.id}
                        >
                          Start Scan
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
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
