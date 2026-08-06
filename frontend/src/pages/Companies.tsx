import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link as ChakraLink,
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
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, formatDate, LoadingState } from '../components/common/PageStates'
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge'
import {
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from '../hooks/useCompanies'
import { useAuth } from '../auth/useAuth'
import { useCreateScan, useScans } from '../hooks/useScans'
import { getErrorMessage } from '../services/api'
import type { Company } from '../types'
import { activeScans, buildCompanyOverviews } from '../utils/companyOverview'

type FormMode = 'create' | 'edit'

export function Companies() {
  const { isAdmin, isAnalyst } = useAuth()
  const { data: companies, isLoading, error } = useCompanies()
  const scansQuery = useScans()
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
        description: `${companyName} scan #${scan.id} is ${scan.status}. See it below under Scans in progress.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      // Stay on Companies page — in-progress table updates via query invalidation
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

  if (isLoading || scansQuery.isLoading) {
    return <LoadingState label="Loading companies…" />
  }

  if (error || scansQuery.error) {
    return <ErrorState message={getErrorMessage(error ?? scansQuery.error)} />
  }

  const isSaving = createCompany.isPending || updateCompany.isPending
  const overviews = buildCompanyOverviews(companies ?? [], scansQuery.data ?? [])
  const inProgress = activeScans(scansQuery.data ?? [])

  return (
    <VStack align="stretch" spacing={{ base: 4, md: 6 }} w="full" minW={0}>
      <Flex
        justify="space-between"
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
      >
        <Stack spacing={1}>
          <Heading size={{ base: 'md', md: 'lg' }} letterSpacing="tight">
            Companies
          </Heading>
          <Text color="cyber.muted" fontSize="sm">
            Manage companies here — start a scan and watch progress in the table below
          </Text>
        </Stack>
        {isAdmin ? <Button onClick={openCreateModal}>Add Company</Button> : null}
      </Flex>

      <Card>
        <CardBody>
          {overviews.length === 0 ? (
            <EmptyState
              title="No companies yet"
              description="Add a company to start monitoring its attack surface."
            />
          ) : (
            <TableContainer overflowX="auto" maxW="100%">
              <Table variant="simple" size="sm" minW={{ base: '640px', md: 'auto' }}>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Domain</Th>
                    <Th>Scans</Th>
                    <Th>Latest status</Th>
                    <Th>Latest score</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {overviews.map((item) => (
                    <Tr key={item.company.id} _hover={{ bg: 'blackAlpha.50' }}>
                      <Td>
                        <ChakraLink
                          as={Link}
                          to={`/companies/${item.company.id}`}
                          color="brand.500"
                          fontWeight="600"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          {item.company.name}
                        </ChakraLink>
                      </Td>
                      <Td fontFamily="mono" fontSize="sm" color="cyber.muted">
                        {item.company.domain}
                      </Td>
                      <Td fontFamily="mono" fontSize="sm">
                        {item.scanCount}
                      </Td>
                      <Td>
                        {item.latestScan ? (
                          <StatusBadge status={item.latestScan.status} />
                        ) : (
                          <Text fontSize="sm" color="cyber.muted">
                            Never scanned
                          </Text>
                        )}
                      </Td>
                      <Td>
                        {item.latestCompleted ? (
                          <HStack spacing={2}>
                            <Text fontFamily="mono" fontSize="sm">
                              {item.latestCompleted.securityScore}/100
                            </Text>
                            <RiskBadge level={item.latestCompleted.riskLevel} />
                          </HStack>
                        ) : (
                          <Text fontSize="sm" color="cyber.muted">
                            —
                          </Text>
                        )}
                      </Td>
                      <Td textAlign="right">
                        <HStack justify="flex-end" spacing={2}>
                          {isAnalyst ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => void handleStartScan(item.company.id, item.company.name)}
                              isLoading={startingCompanyId === item.company.id}
                              isDisabled={item.hasActiveScan}
                            >
                              Start Scan
                            </Button>
                          ) : null}
                          {isAdmin ? (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => openEditModal(item.company)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                color="red.300"
                                _hover={{ bg: 'red.900', color: 'red.200' }}
                                onClick={() => openDeleteModal(item.company)}
                              >
                                Delete
                              </Button>
                            </>
                          ) : null}
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

      <Card>
        <CardHeader pb={2}>
          <Heading size="sm">Scans in progress</Heading>
          <Text fontSize="sm" color="cyber.muted" mt={1}>
            Live jobs on this page — start a scan above, status updates here
          </Text>
        </CardHeader>
        <CardBody pt={0}>
          {inProgress.length === 0 ? (
            <Text fontSize="sm" color="cyber.muted" py={2}>
              No scans running right now.
            </Text>
          ) : (
            <TableContainer overflowX="auto" maxW="100%">
              <Table variant="simple" size="sm" minW={{ base: '480px', md: 'auto' }}>
                <Thead>
                  <Tr>
                    <Th>Company</Th>
                    <Th>Domain</Th>
                    <Th>Scan</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {inProgress.map((scan) => (
                    <Tr key={scan.id} _hover={{ bg: 'blackAlpha.50' }}>
                      <Td fontWeight="600">{scan.companyName}</Td>
                      <Td fontFamily="mono" fontSize="sm" color="cyber.muted">
                        {scan.domain}
                      </Td>
                      <Td fontFamily="mono" fontSize="sm">
                        #{scan.id}
                      </Td>
                      <Td>
                        <StatusBadge status={scan.status} />
                      </Td>
                      <Td fontFamily="mono" fontSize="sm">
                        {formatDate(scan.date)}
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
