import { useEffect, useState } from 'react'

function snapshotLocation() {
  return {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  }
}

export function useAppRoute() {
  const [route, setRoute] = useState(snapshotLocation)

  useEffect(() => {
    function handleChange() {
      setRoute(snapshotLocation())
    }

    window.addEventListener('popstate', handleChange)
    window.addEventListener('hashchange', handleChange)

    return () => {
      window.removeEventListener('popstate', handleChange)
      window.removeEventListener('hashchange', handleChange)
    }
  }, [])

  function navigate(path, { replace = false } = {}) {
    if (!path) return

    if (replace) {
      window.history.replaceState({}, '', path)
    } else {
      window.history.pushState({}, '', path)
    }

    setRoute(snapshotLocation())
  }

  return {
    ...route,
    navigate,
  }
}
