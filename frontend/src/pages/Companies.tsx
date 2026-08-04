import {
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
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
import {
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from '../hooks/useCompanies'
import { useCreateScan } from '../hooks/useScans'
import { getErrorMessage } from '../services/api'
import type { Company } from '../types'

type FormMode = 'create' | 'edit'

export function Companies() {
  const { data: companies, isLoading, error } = useCompanies()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()
  const deleteCompany = useDeleteCompany()
  const createScan = useCreateScan()

  const formModal = useDisclosure()
  const deleteModal = useDisclosure()
  const toast = useToast()

  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [startingCompanyId, setStartingCompanyId] = useState<number | null>(null)

  function resetForm() {
    setName('')
    setDomain('')
    setEditingCompany(null)
    setFormMode('create')
  }

  function openCreateModal() {
    resetForm()
    setFormMode('create')
    formModal.onOpen()
  }

  function openEditModal(company: Company) {
    setFormMode('edit')
    setEditingCompany(company)
    setName(company.name)
    setDomain(company.domain)
    formModal.onOpen()
  }

  function handleFormClose() {
    resetForm()
    formModal.onClose()
  }

  function openDeleteModal(company: Company) {
    setCompanyToDelete(company)
    deleteModal.onOpen()
  }

  function handleDeleteClose() {
    setCompanyToDelete(null)
    deleteModal.onClose()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const payload = { name: name.trim(), domain: domain.trim() }

    try {
      if (formMode === 'edit' && editingCompany) {
        await updateCompany.mutateAsync({ id: editingCompany.id, payload })
        toast({
          title: 'Company updated',
          description: `${payload.name} was updated successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        await createCompany.mutateAsync(payload)
        toast({
          title: 'Company added',
          description: `${payload.name} was created successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
      handleFormClose()
    } catch (err) {
      toast({
        title: formMode === 'edit' ? 'Unable to update company' : 'Unable to add company',
        description: getErrorMessage(err),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  async function handleConfirmDelete() {
    if (!companyToDelete) return

    try {
      await deleteCompany.mutateAsync(companyToDelete.id)
      toast({
        title: 'Company deleted',
        description: `${companyToDelete.name} was removed.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      handleDeleteClose()
    } catch (err) {
      toast({
        title: 'Unable to delete company',
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

  const isSaving = createCompany.isPending || updateCompany.isPending

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
        <Button onClick={openCreateModal}>Add Company</Button>
      </Flex>

      <Card>
        <CardBody>
          {!companies || companies.length === 0 ? (
            <EmptyState
              title="No companies yet"
              description="Add a company to start monitoring its attack surface."
            />
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
                        <HStack justify="flex-end" spacing={2}>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => void handleStartScan(company.id, company.name)}
                            isLoading={startingCompanyId === company.id}
                          >
                            Start Scan
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => openEditModal(company)}>
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            color="red.300"
                            _hover={{ bg: 'red.900', color: 'red.200' }}
                            onClick={() => openDeleteModal(company)}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={formModal.isOpen} onClose={handleFormClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>{formMode === 'edit' ? 'Edit Company' : 'Add Company'}</ModalHeader>
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
            <Button variant="ghost" onClick={handleFormClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {formMode === 'edit' ? 'Save changes' : 'Add Company'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={handleDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete company</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color="cyber.muted">
              Delete <Text as="span" color="cyber.text" fontWeight="600">{companyToDelete?.name}</Text>
              ? Related scans will also be removed.
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={handleDeleteClose}>
              Cancel
            </Button>
            <Button
              bg="red.500"
              color="white"
              _hover={{ bg: 'red.400' }}
              onClick={() => void handleConfirmDelete()}
              isLoading={deleteCompany.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
