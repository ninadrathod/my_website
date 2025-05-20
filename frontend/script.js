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

async function fetchAndDisplayCards(category, containerId) {
  try {
    apiUrl = `http://localhost:3001/api/data/${category}`
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if(category === 'work_exp')          { displayWorkExperience(data.data, containerId); } 
    else if(category === 'education')    { displayEducation(data.data, containerId); }
    else if(category === 'publication')  { displayPublication(data.data, containerId); }
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
      experienceDiv.classList.add('card');

      const headingPara = document.createElement('p');

          const companyHeading = document.createElement('span');
          companyHeading.classList.add('montserrat-regular');
          companyHeading.textContent = experience.Company;

          const companyLocation = document.createElement('span');
          companyLocation.classList.add('montserrat-light');
          companyLocation.textContent = `, ${experience.Location}`;

          headingPara.appendChild(companyHeading);
          headingPara.appendChild(companyLocation);
       
      const rolePara = document.createElement('p');
          rolePara.classList.add('mt-3');

          const role =document.createElement('span');
          role.classList.add('montserrat-regular','text-sm');
          role.textContent = 'Designation: ';
          
          const roleDesc = document.createElement('span');
          roleDesc.classList.add('montserrat-light', 'text-sm');
          roleDesc.textContent = experience.Role;

          rolePara.appendChild(role);
          rolePara.appendChild(roleDesc);

      const durationPara = document.createElement('p');
      durationPara.classList.add('montserrat-extralight', 'text-sm', 'mt-3');
      to_month_year = experience.to_month_year ? ' to ' + experience.to_month_year : ' to Present'
      durationPara.textContent = `${experience.from_month_year}${to_month_year}`;

      const responsibilitiesPara = document.createElement('p');
        responsibilitiesPara.classList.add('mt-3');

        const responsibilitiesParagraph = document.createElement('span');
        responsibilitiesParagraph.classList.add('montserrat-light','text-sm');
        responsibilitiesParagraph.innerHTML = `${experience.responsibilities}`;

        responsibilitiesPara.appendChild(responsibilitiesParagraph);

      experienceDiv.appendChild(headingPara);
      experienceDiv.appendChild(durationPara);
      experienceDiv.appendChild(rolePara);
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
  //container.classList.add('w-full','text-center','flex border-2');

  let x = 1; 
  if (educationData && educationData.length > 0) {
     
    educationData.forEach(education => {
      
      const educationDiv = document.createElement('div');
      educationDiv.classList.add('w-full','text-center','flex','mb-10','px-[10%]');
      
      const collegeDiv = document.createElement('div');
      const line = document.createElement('div');
      line.classList.add('border-r-1','border-gray-500');
      const yearsDiv = document.createElement('div');

      if(x==1){
        collegeDiv.classList.add('left');
        yearsDiv.classList.add('right');        
      }
      else{
        collegeDiv.classList.add('right');
        yearsDiv.classList.add('left');
      }
      
          const headingPara = document.createElement('p');
          headingPara.classList.add('monserrat-regular','text-lg','tracking-wider');
          headingPara.textContent = education.institution_name;

          const degreePara = document.createElement('p');
          degreePara.classList.add('montserrat-light','mt-2','text-base')
          degreePara.textContent = `${education.degree_program_certificate}`;

          const scorePara = document.createElement('p');
          scorePara.classList.add('montserrat-light','mt-2');
          scorePara.textContent = `${education.score_type}: ${education.score} / ${education.score_on_scale}`;

          const durationPara = document.createElement('p');
          durationPara.classList.add('montserrat-extralight','text-lg');
          to_month_year = education.to_month_year ? ' to ' + education.to_month_year : ' to Present'
          durationPara.textContent = `${education.from_month_year}${to_month_year}`;

      
      collegeDiv.appendChild(headingPara);
      collegeDiv.appendChild(degreePara);
      collegeDiv.appendChild(scorePara);
      
      yearsDiv.appendChild(durationPara);

      if(x==1){
        educationDiv.appendChild(collegeDiv);
        educationDiv.appendChild(line);
        educationDiv.appendChild(yearsDiv);
      }
      else{
        educationDiv.appendChild(yearsDiv);
        educationDiv.appendChild(line);
        educationDiv.appendChild(collegeDiv);
      }
      
      container.appendChild(educationDiv);
      
      x = (x%2)+1;
    });
  } else {
    container.textContent = 'No education data available.';
  }
}

function displayPublication(publicationData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content
  //container.classList.add('mt-10','flex','flex-col','text-center','justify-center')

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

const loaderContainer = document.querySelector('#loader-container');
const pageContent = document.querySelector('#page-content');
const workExpOuterContainer = document.querySelector('#work-exp-outer-container');
const topBoxText = document.querySelector('#top-box-text');

window.addEventListener('load', () => {
  //  Fetch and display data:
  Promise.all([
    fetchAndDisplayProperty('name', 'name-display'),
    fetchAndDisplayProperty('summary', 'summary-display'),
    fetchAndDisplayCards('work_exp', 'work-experience-container'),
    fetchAndDisplayCards('education', 'education-container'),
  ]).then(() => {
    // This code runs after all promises in Promise.all have resolved
    loaderContainer.classList.remove('visible');
    loaderContainer.classList.add('invisible');
    pageContent.classList.remove('invisible');
    pageContent.classList.add('visible');
    topBoxText.classList.add('animate-text-appear-from-right');
    workExpOuterContainer.classList.add('animate-text-appear-from-left');
  }).catch(error => {
    console.error("Failed to load data:", error);
    //  Handle the error appropriately, e.g., display an error message to the user
    loaderContainer.classList.remove('invisible'); // Optionally keep loader
    pageContent.classList.add('invisible');
  });
});

/*
Color palettes:
https://colorhunt.co/palette/3d8d7ab3d8a8fbffe4a3d1c6
*/
