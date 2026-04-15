export function getPostIdFromRoute(route) {
  const match = route.match(/[?&]id=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function getPublicFormIdFromRoute(route) {
  const match = route.match(/[?&]form_id=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getTabFromRoute(route) {
  const pathMatch = route.match(/^form\/edit\/([^?]+)/);
  if (pathMatch) {
    const pathValue = decodeURIComponent(pathMatch[1]);
    return pathValue.split("/")[0] || null;
  }

  const queryMatch = route.match(/[?&]tab=([^&]+)/);
  return queryMatch ? decodeURIComponent(queryMatch[1]) : null;
}

export function buildEditRouteForCreatedForm(createdForm, tabName = null) {
  const safeTab = tabName ? encodeURIComponent(tabName) : "";
  const safeFormId = createdForm?.form_id
    ? encodeURIComponent(createdForm.form_id)
    : "";

  if (safeFormId) {
    return safeTab
      ? `form/edit/${safeTab}?form_id=${safeFormId}`
      : `form/edit?form_id=${safeFormId}`;
  }

  const safePostId = createdForm?.post_id
    ? encodeURIComponent(String(createdForm.post_id))
    : "";

  if (safePostId) {
    return safeTab
      ? `form/edit/${safeTab}?id=${safePostId}`
      : `form/edit?id=${safePostId}`;
  }

  return "form";
}
