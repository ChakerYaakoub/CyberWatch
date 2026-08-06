import { useEffect } from 'react'
import { LoadingState } from '../components/common/PageStates'
import { getUserManager } from '../auth/TokenManager'

/** iframe / silent redirect target for oidc-client-ts token renewal */
export function SilentRenew() {
  useEffect(() => {
    void getUserManager().signinSilentCallback().catch((error) => {
      console.error('Silent renew callback failed', error)
    })
  }, [])

  return <LoadingState fullScreen label="Renewing session…" />
}
