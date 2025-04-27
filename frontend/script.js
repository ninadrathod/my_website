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

async function fetchAndDisplayWorkExperience(category) {
  try {
    apiUrl = `http://localhost:3001/api/data/${category}`
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if(category === 'work_exp')          { displayWorkExperience(data.data, 'work-experience-container'); } 
    else if(category === 'education')    { displayEducation(data.data, 'education-container'); }
    else if(category === 'publication')  { displayPublication(data.data, 'publication-container'); }
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    if(category === 'work_exp')
    { document.getElementById('work-experience-container').textContent = 'Failed to load work experience.'; }
    else if(category === 'education')
    { document.getElementById('education-container').textContent = 'Failed to load education.'; }
    else if(category === 'publication')
    { document.getElementById('publication-container').textContent = 'Failed to load publication.'; }

  }
}

function displayWorkExperience(workExperienceData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content

  if (workExperienceData && workExperienceData.length > 0) {
    workExperienceData.forEach(experience => {
      const experienceDiv = document.createElement('div');
      experienceDiv.classList.add('mb-4', 'border', 'border-gray-300', 'rounded-md', 'p-4');

      const headingPara = document.createElement('p');

          const companyHeading = document.createElement('span');
          companyHeading.classList.add('text-xl', 'font-semibold', 'text-gray-800', 'mb-1');
          companyHeading.textContent = experience.Company;

          const companyLocation = document.createElement('span');
          companyLocation.classList.add('text-lg', 'font-medium', 'text-gray-800', 'mb-1');
          companyLocation.textContent = `, ${experience.Location}`;

          const roleSpan = document.createElement('span');
          roleSpan.classList.add('text-lg', 'font-medium', 'italic', 'text-gray-700', 'mb-1');
          roleSpan.textContent = ` - ${experience.Role}`;
      
          headingPara.appendChild(companyHeading);
          headingPara.appendChild(companyLocation);
          headingPara.appendChild(roleSpan);

      const durationPara = document.createElement('p');
      durationPara.classList.add('text-base', 'font-thin', 'text-gray-700', 'mb-1');
      to_month_year = experience.to_month_year ? ' to ' + experience.to_month_year : ' to Present'
      durationPara.textContent = `${experience.from_month_year}${to_month_year}`;

      const responsibilitiesPara = document.createElement('p');

        const responsibilitiesHeading = document.createElement('span');
        responsibilitiesHeading.classList.add('text-md', 'font-semibold', 'text-gray-700', 'mb-1');
        responsibilitiesHeading.textContent = 'Responsibilities: ';

        const responsibilitiesParagraph = document.createElement('span');
        responsibilitiesParagraph.classList.add('text-gray-600');
        responsibilitiesParagraph.innerHTML = `Responsibilities: ${experience.responsibilities}`;

        responsibilitiesPara.appendChild(responsibilitiesHeading);
        responsibilitiesPara.appendChild(responsibilitiesParagraph);

      experienceDiv.appendChild(headingPara);
      experienceDiv.appendChild(durationPara);
      experienceDiv.appendChild(responsibilitiesPara);
      container.appendChild(experienceDiv);
    });
  } else {
    container.textContent = 'No work experience data available.';
  }
}

function displayEducation(educationData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content

  if (educationData && educationData.length > 0) {
    educationData.forEach(education => {
      
      const educationDiv = document.createElement('div');
      educationDiv.classList.add('mb-4', 'border', 'border-gray-300', 'rounded-md', 'p-4');

          const headingPara = document.createElement('p');
          headingPara.classList.add('text-xl', 'font-semibold', 'text-gray-800', 'mb-1');
          headingPara.textContent = education.institution_name;

          const durationPara = document.createElement('p');
          durationPara.classList.add('text-base', 'font-thin', 'text-gray-700', 'mb-1');
          to_month_year = education.to_month_year ? ' to ' + education.to_month_year : ' to Present'
          durationPara.textContent = `${education.from_month_year}${to_month_year}`;

          const degreePara = document.createElement('p');
          degreePara.classList.add('text-md', 'font-semibold', 'text-gray-700', 'mb-1');
          degreePara.textContent = `${education.degree_program_certificate}`;

          const scorePara = document.createElement('p');
          scorePara.classList.add('text-md', 'font-semibold', 'text-gray-700', 'mb-1');
          scorePara.textContent = `${education.score_type}: ${education.score}/${education.score_on_scale}`;
    
      educationDiv.appendChild(headingPara);
      educationDiv.appendChild(durationPara);
      educationDiv.appendChild(degreePara);
      educationDiv.appendChild(scorePara);

      container.appendChild(educationDiv);
    });
  } else {
    container.textContent = 'No education data available.';
  }
}

function displayPublication(publicationData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content

  if (publicationData && publicationData.length > 0) {
    publicationData.forEach(publication => {
      
      const publicationDiv = document.createElement('div');
      publicationDiv.classList.add('mb-4', 'border', 'border-gray-300', 'rounded-md', 'p-4');

          const headingPara = document.createElement('p');

              const paperTitle = document.createElement('span')
              paperTitle.classList.add('text-xl', 'font-semibold', 'text-gray-800', 'mb-1');
              paperTitle.textContent = publication.title;

              const paperPublication = document.createElement('span')
              paperPublication.classList.add('text-ls', 'italic', 'font-medium', 'text-gray-800', 'mb-1');
              paperPublication.textContent = ` - ${publication.conference_journal_name}`;

          headingPara.appendChild(paperTitle);
          headingPara.appendChild(paperPublication);

          const bookSeriesPara = document.createElement('p');

              const bookSeriesHeading = document.createElement('span');
              bookSeriesHeading.classList.add('text-md', 'font-semibold', 'text-gray-700', 'mb-1');
              bookSeriesHeading.textContent = 'Book Series: ';

              const bookSeries = document.createElement('span');
              bookSeries.classList.add('text-base', 'font-medium', 'text-gray-700', 'mb-1');
              bookSeries.textContent = publication.book_series;

              bookSeriesPara.appendChild(bookSeriesHeading);
              bookSeriesPara.appendChild(bookSeries);
    
      publicationDiv.appendChild(headingPara);
      publicationDiv.appendChild(bookSeriesPara);

      container.appendChild(publicationDiv);
    });
  } else {
    container.textContent = 'No education data available.';
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
  fetchAndDisplayWorkExperience('work_exp');
  fetchAndDisplayWorkExperience('education');
  fetchAndDisplayWorkExperience('publication');
};