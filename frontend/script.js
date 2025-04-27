async function fetchAndDisplayProperty(property, displayPropertyId) {
  try {
    const apiUrl = `http://localhost:3001/api/metadata/${property}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    document.getElementById(displayPropertyId).textContent = data.data;
  } catch (error) {
    console.error(`Error fetching ${property}`, error);
    document.getElementById(displayPropertyId).textContent = 'Failed to load name.';
  }
}

async function fetchAndReturnLink(property, linkId) {
  try {
    const apiUrl = `http://localhost:3001/api/metadata/${property}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const linkElement = document.getElementById(linkId);
    if (linkElement) 
    {
      if (property === 'email_id') {
        linkElement.href = `mailto:${data.data}`;
      } else {
        linkElement.href = data.data;
      }
    } 
    else 
    {
      console.error(`Link element with ID '${linkId}' not found.`);
    }
  } catch (error) {
    console.error(`Error fetching ${property}:`, error);
    const linkElement = document.getElementById(linkId);
    if (linkElement) {
      linkElement.href = '#'; // Set a default or error link
    }
  }
}

window.onload = () => {
  fetchAndDisplayProperty('name', 'name-display');
  fetchAndDisplayProperty('bio', 'bio-display');
  fetchAndDisplayProperty('summary', 'summary-display');
  fetchAndDisplayProperty('email_id', 'email_id-display');
  fetchAndDisplayProperty('linkedin', 'linkedin-display');
  fetchAndDisplayProperty('github', 'github-display');
  fetchAndReturnLink('email_id', 'email_id-link');
  fetchAndReturnLink('linkedin', 'linkedin-link');
  fetchAndReturnLink('github', 'github-link');
};