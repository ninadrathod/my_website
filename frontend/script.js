// scrolling transitions

// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis({
  damping: 0.5,
});

// Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
lenis.on('scroll', ScrollTrigger.update);

// Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
// This ensures Lenis's smooth scroll animation updates on each GSAP tick
gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

// Disable lag smoothing in GSAP to prevent any delay in scroll animations
gsap.ticker.lagSmoothing(0);

//---------------

/*gsap.from("#page-content #top-box #top-box-text #name-display",{
  transform: translateX(-100),
  duration: 2,
  scrollTrigger:{
    trigger: "#page-content #top-box #top-box-text #name-display",
    scroller: "body",
    markers: true
  }
})
*/
//---------------------------------------------------

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
    else if(category === 'projects')     { displayProjects(data.data, containerId); }
    else if(category === 'technical_skills')     { displaySkills(data.data, containerId); }
    else if(category === 'areas_of_interest')     { displayInterestAreas(data.data, containerId); }
    else if(category === 'extracurricular_activities') {displayExtracurricularActivities(data.data, containerId);}
    else if(category === 'positions_of_responsibilities') {displayPOR(data.data, containerId);}
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    if(category === 'work_exp')
    { document.getElementById(containerId).textContent = 'Failed to load work experience.'; }
    else if(category === 'education')
    { document.getElementById(containerId).textContent = 'Failed to load education.'; }
    else if(category === 'publication')
    { document.getElementById(containerId).textContent = 'Failed to load publication.'; }
    else if(category === 'projects')
      { document.getElementById(containerId).textContent = 'Failed to load projects.'; }
    else if(category === 'technical_skills')
      { document.getElementById(containerId).textContent = 'Failed to load skills.'; }
    else if(category === 'areas_of_interest')
      { document.getElementById(containerId).textContent = 'Failed to load areas of interest.'; }
    else if(category === 'extracurricular_activities')
      { document.getElementById(containerId).textContent = 'Failed to load extracurricular activities.'; }
    else if(category === 'positions_of_responsibilities')
      { document.getElementById(containerId).textContent = 'Failed to load positions of responsibilities.'; }
  }
}

function displayWorkExperience(workExperienceData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content
  
  if (workExperienceData && workExperienceData.length > 0) {
    workExperienceData.forEach(experience => {
      const experienceDiv = document.createElement('div');
      experienceDiv.classList.add('card','mb-[2.5%]','lg:mb-[0%]');

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
  
  if (educationData && educationData.length > 0) {
     
    educationData.forEach(education => {
      
      const educationDiv = document.createElement('div');
      educationDiv.classList.add('w-full','text-center','flex','mb-10','px-[10%]');
      
      const collegeDiv = document.createElement('div');
      const line = document.createElement('div');
      line.classList.add('border-r-1','border-seashell');
      const yearsDiv = document.createElement('div');

      collegeDiv.classList.add('left');
      yearsDiv.classList.add('right');        
      
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

        educationDiv.appendChild(collegeDiv);
        educationDiv.appendChild(line);
        educationDiv.appendChild(yearsDiv);
      
      container.appendChild(educationDiv);
      
   
    });
  } else {
    container.textContent = 'No education data available.';
  }
}

function displayProjects(projectsData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content

  if (projectsData && projectsData.length > 0) {
    projectsData.forEach(project => {
      const projectDiv = document.createElement('div');
      projectDiv.classList.add('project-card');

      const projectType = document.createElement('p');
      projectType.classList.add('montserrat-extralight-i','text-sm');
      projectType.textContent = `${project.type} project`;

      const projectTitle = document.createElement('p');
      projectTitle.classList.add('montserrat-regular','text-lg');
      projectTitle.textContent = project.project_title;
      
      const domain = document.createElement('p');
      domain.classList.add('montserrat-light','my-[0.5%]');
      domain.textContent = project.course_or_domain;

      const description = document.createElement('p');
      description.classList.add('montserrat-extralight');
      description.textContent = project.project_description;

      projectDiv.appendChild(projectType);
      projectDiv.appendChild(projectTitle);
      projectDiv.appendChild(domain);
      projectDiv.appendChild(description);
      
      container.appendChild(projectDiv);
    });
  } else {
    container.textContent = 'No project data available.';
  }
}

function displayInterestAreas(interestAreasData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content

  if (interestAreasData && interestAreasData.length > 0) {
    interestAreasData.forEach(interest => {
      const interestsDiv = document.createElement('div');
      interestsDiv.classList.add('my-[2.5%]','montserrat-light-i','text-seashell');
      interestsDiv.textContent = `> ${interest.interest_area}`;      
      container.appendChild(interestsDiv);
    });
  } else {
    container.textContent = 'No areas of interests data available.';
  }
}

function displayExtracurricularActivities(extracurricularActivitiesData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content
  container.classList.add('text-center','text-gray-800');

  var cntr = 0;
  dataLen = extracurricularActivitiesData.length;
  if (extracurricularActivitiesData && extracurricularActivitiesData.length > 0) {
    extracurricularActivitiesData.forEach(activityItem => {
      const activity_li = document.createElement('div');
      activity_li.classList.add('montserrat-regular','text-sm');
      activity_li.innerHTML = activityItem.activity;      
     
      const bottomSeparator = document.createElement('hr');
      bottomSeparator.classList.add('w-[10%]','mx-auto','my-[4%]','opacity-70','border-gray-400');
      
      container.appendChild(activity_li);
      if(cntr < dataLen-1) { container.appendChild(bottomSeparator); }
      cntr++;
    
    });
  } else {
    container.textContent = 'No extracurriular activity data available.';
  }
}

function displayPOR(porData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content
  container.classList.add('text-center','text-gray-800');

  var cntr = 0;
  portDataLen = porData.length;
  if (porData && porData.length > 0) {
    porData.forEach(porItem => {
      const por_li = document.createElement('div');
      
      const por_title = document.createElement('p');
      por_title.classList.add('montserrat-regular','text-sm');
      por_title.textContent = `${porItem.por} (${porItem.from_year} - ${porItem.to_year})`;

      const por_club = document.createElement('p');
      por_club.classList.add('montserrat-light','text-sm');
      por_club.textContent = porItem.club_group;

      const por_institution = document.createElement('p');
      por_institution.classList.add('montserrat-light','text-sm');
      por_institution.textContent = porItem.institution;
      
      const bottomSeparator = document.createElement('hr');
      bottomSeparator.classList.add('w-[10%]','mx-auto','my-[4%]','opacity-70','border-gray-400');

      por_li.appendChild(por_title);
      por_li.appendChild(por_club);
      por_li.appendChild(por_institution);
      if(cntr < portDataLen-1) { por_li.appendChild(bottomSeparator); }
      cntr++;
      container.appendChild(por_li);


    });

  } else {
    container.textContent = 'No POR data available.';
  }
}

function displaySkills(skillsData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content

  if (skillsData && skillsData.length > 0) {
    skillsData.forEach(skill => {
      const skillsDiv = document.createElement('div');
      skillsDiv.classList.add('my-[7.5%]');

      const skillType = document.createElement('p');
      skillType.classList.add('montserrat-regular');
      skillType.textContent = skill.type;
      
      // Create a list for specific skills
      const specificListDiv = document.createElement('div');
      specificListDiv.classList.add('montserrat-light-i','ml-[3%]','mt-[1%]'); // Indent the list

      if (skill.specific_list && skill.specific_list.length > 0) {
        skill.specific_list.forEach(name => {
          const skillItem = document.createElement('p');
          //skillItem.classList.add('mb-[1%]'); // Small margin below each item
          skillItem.textContent = name;
          specificListDiv.appendChild(skillItem);
        });
      } else {
        const noSkillsMessage = document.createElement('p');
        noSkillsMessage.textContent = "No specific skills listed for this category.";
        specificListDiv.appendChild(noSkillsMessage);
      }

      skillsDiv.appendChild(skillType);
      skillsDiv.appendChild(specificListDiv);
      
      container.appendChild(skillsDiv);
    });
  } else {
    container.textContent = 'No skill data available.';
  }
}

function displayPublication(publicationData, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear any existing content
  //container.classList.add('mt-10','flex','flex-col','text-center','justify-center')

  if (publicationData && publicationData.length > 0) {
    publicationData.forEach(publication => {
      
      const publicationDiv = document.createElement('div');
      publicationDiv.classList.add('text-seashell','rounded-md','text-center','items-center','p-[3%]');

              const topSeparator = document.createElement('hr');
              topSeparator.classList.add('w-[40%]','mx-auto','mb-[5%]','opacity-50');

              const paperTitle = document.createElement('p');
              paperTitle.classList.add('montserrat-regular','text-lg', 'mb-[1%]');
              paperTitle.textContent = publication.title;

              const paperPublication = document.createElement('p');
              paperPublication.classList.add('montserrat-light', 'mb-[1%]');
              paperPublication.textContent = publication.conference_journal_name;

              const bookSeries = document.createElement('p');
              bookSeries.classList.add('montserrat-extralight', 'mb-[1%]');
              bookSeries.textContent = `Book series: ${publication.book_series}`;

      publicationDiv.appendChild(topSeparator);
      publicationDiv.appendChild(paperTitle);
      publicationDiv.appendChild(paperPublication);
      publicationDiv.appendChild(bookSeries);

      container.appendChild(publicationDiv);
    });
  } else {
    container.textContent = 'No publication data available.';
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
    fetchAndDisplayCards('projects', 'projects-container'),
    fetchAndDisplayCards('technical_skills', 'skills-container'),
    fetchAndDisplayCards('areas_of_interest', 'areas-of-interest-container'),
    fetchAndDisplayCards('publication', 'publication-container'),
    fetchAndDisplayCards('extracurricular_activities', 'extracurricular-container'),
    fetchAndDisplayCards('positions_of_responsibilities', 'por-container'),

  ]).then(() => {
    // This code runs after all promises in Promise.all have resolved
    loaderContainer.classList.remove('visible');
    loaderContainer.classList.add('invisible');
    pageContent.classList.remove('invisible');
    pageContent.classList.add('visible');
    //topBoxText.classList.add('animate-text-appear-from-right');
    //workExpOuterContainer.classList.add('animate-text-appear-from-left');

    /*gsap.from("#page-content #top-box #name-display",{
      x: "34vw",
      paddingTop: "2%",
      duration: 2,
      paddingBottom: "2%",
      scrollTrigger:{
        trigger: "main",
        scroller: "body",
        markers: true,
        start:"top 10%",
        scrub: 2
      }
    })*/
   /* gsap.to("#page-content #top-box #summary-display",{
      height:"10%",
      opacity: 1,
      duration: 2,
      paddingBlock: "1%",
      scrollTrigger:{
        trigger: "main",
        scroller: "body",
        markers: true,
        start:"top 10%",
        scrub: true
      }
    });*/

    /*gsap.to("#summary-display", {
      height: 0,          // Animate height to 0
      paddingTop: 0,      // Animate top padding to 0
      paddingBottom: 0,   // Animate bottom padding to 0
      opacity: 0,         // Animate opacity to 0
      duration: 1.5,      // Duration of the animation (will be stretched by scrub)
      ease: "power2.out", // Easing function
      scrollTrigger: {
        trigger: "main",      // The element that triggers the animation
        start: "top 30%",     // Animation starts when the top of 'main' hits 10% from viewport top
        end: "top -50%",      // Animation ends when the top of 'main' goes 50% *above* viewport top (adjust as needed)
        scroller: "body",     // Explicitly use the body as the scroller
        markers: true,        // Uncomment for visual debugging
        scrub: true           // Links the animation progress directly to the scroll position
      }
    });*/
    /*
    ScrollTrigger.create({
      trigger: "main",      // The element that triggers the action
      start: "top 31%",     // When the top of 'main' hits 10% from viewport top
      scroller: "body",     // Explicitly use the body as the scroller
      markers: true,        // Uncomment for visual debugging
      onEnter: () => {
        // When scrolling down and the trigger is met, smoothly animate to the LEFT (34vw)
        gsap.to("#name-display", { x: "-30vw", paddingTop: "1%", paddingBottom: "1%", duration: 1, ease: "sine.in" });
      },
      onLeaveBack: () => {
        // When scrolling up and passing the trigger point again, smoothly animate back to CENTER (x: 0)
        gsap.to("#name-display", { x: 0, paddingTop: "1%", paddingBottom: "1%", duration: 1, ease: "sine.in" });
      }
    });
    */
    /*
    ScrollTrigger.create({
      trigger: "main",      // The element that triggers the action
      start: "top 31%",     // When the top of 'main' hits 10% from viewport top
      scroller: "body",     // Explicitly use the body as the scroller
      markers: true,        // Uncomment for visual debugging
      onEnter: () => {
        // When scrolling down and the trigger is met, smoothly animate to hidden state
        gsap.to("#summary-display", { height: 0, paddingTop: 0, paddingBottom: 0, opacity: 0, duration: 1, marginBottom: 10, ease: "sine.in" });
      },
      onLeaveBack: () => {
        // When scrolling up and passing the trigger point again, smoothly animate to visible state
        gsap.to("#summary-display", { height: "auto", paddingTop: "1%", paddingBottom: "1%", opacity: 1, duration: 1, ease: "sine.in" });
      }
      // No scrub, no duration on the ScrollTrigger itself for instant changes
    });*/
  }).catch(error => {
    console.error("Failed to load data:", error);
    //  Handle the error appropriately, e.g., display an error message to the user
    loaderContainer.classList.remove('invisible'); // Optionally keep loader
    pageContent.classList.add('invisible');
  });
});

const header = document.querySelector('#top-box');

//window.addEventListener('scroll', () => {
//  const scrollPosition = window.scrollY;

//}

/*
Color palettes:
https://colorhunt.co/palette/3d8d7ab3d8a8fbffe4a3d1c6
*/
