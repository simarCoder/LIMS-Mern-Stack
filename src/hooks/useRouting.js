import { useState, useEffect, useCallback } from "react";

/**
 * Parse browser pathname into a structured route object.
 * Examples:
 *   /                     -> { page: "Dashboard", sub: null, id: null, path: "/" }
 *   /patients             -> { page: "Patients", sub: "list", id: null, path: "/patients" }
 *   /patients/new         -> { page: "Patients", sub: "new", id: null, path: "/patients/new" }
 *   /patients/12/edit     -> { page: "Patients", sub: "edit", id: 12, path: "/patients/12/edit" }
 *   /patients/12/receipt  -> { page: "Patients", sub: "receipt", id: 12, path: "/patients/12/receipt" }
 *   /tests                -> { page: "Tests", sub: null, id: null, path: "/tests" }
 *   /diagnosis            -> { page: "Diagnosis", sub: null, id: null, path: "/diagnosis" }
 */
export function parseRoute(pathname = window.location.pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const segments = clean.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { page: "Dashboard", sub: null, id: null, path: "/" };
  }

  const first = segments[0].toLowerCase();

  if (first === "patients") {
    if (segments.length === 1) {
      return { page: "Patients", sub: "list", id: null, path: "/patients" };
    }
    if (segments[1] === "new") {
      return { page: "Patients", sub: "new", id: null, path: "/patients/new" };
    }
    const id = parseInt(segments[1], 10);
    const action = segments[2] ? segments[2].toLowerCase() : null;
    if (!Number.isNaN(id)) {
      if (action === "edit") {
        return { page: "Patients", sub: "edit", id, path: `/patients/${id}/edit` };
      }
      if (action === "receipt") {
        return { page: "Patients", sub: "receipt", id, path: `/patients/${id}/receipt` };
      }
    }
    return { page: "Patients", sub: "list", id: null, path: "/patients" };
  }

  if (first === "diagnosis") {
    if (segments.length === 1) {
      return { page: "Diagnosis", sub: "list", id: null, path: "/diagnosis" };
    }
    const id = parseInt(segments[1], 10);
    const action = segments[2] ? segments[2].toLowerCase() : "entry";
    if (!Number.isNaN(id)) {
      if (action === "report") {
        return { page: "Diagnosis", sub: "report", id, path: `/diagnosis/${id}/report` };
      }
      return { page: "Diagnosis", sub: "entry", id, path: `/diagnosis/${id}` };
    }
    return { page: "Diagnosis", sub: "list", id: null, path: "/diagnosis" };
  }

  if (first === "settings") {
    return {
      page: "Settings",
      sub: segments[1] || "report",
      id: null,
      path: clean,
    };
  }

  const moduleMap = {
    tests: "Tests",
    diagnosis: "Diagnosis",
    samples: "Samples",
    collection: "Collection",
    settings: "Settings",
    login: "Login",
  };

  if (moduleMap[first]) {
    return {
      page: moduleMap[first],
      sub: null,
      id: null,
      path: `/${first}`,
    };
  }

  return { page: "Dashboard", sub: null, id: null, path: "/" };
}

/**
 * Custom routing hook utilizing the browser's native History API.
 * Provides synchronized browser Back & Forward button navigation.
 */
export function useRouting() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  useEffect(() => {
    function handlePopState() {
      setRoute(parseRoute(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = useCallback((targetPath, replace = false) => {
    const target = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
    if (window.location.pathname !== target) {
      if (replace) {
        window.history.replaceState({}, "", target);
      } else {
        window.history.pushState({}, "", target);
      }
    }
    setRoute(parseRoute(target));
  }, []);

  return {
    route,
    navigateTo,
    page: route.page,
    sub: route.sub,
    id: route.id,
  };
}
