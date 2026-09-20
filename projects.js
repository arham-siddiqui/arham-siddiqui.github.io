const projects = {
  "silent-speech": {
    "title": "Multimodal Silent Speech Decoding & Mechanistic Interpretability",
    "dates": "Sep 2025 – Aug 2026",
    "description": "Completed a 30-class silent-speech framework across lip landmarks, mouth video, UWB radar, mmWave radar, and laser-speckle signals. Modality-specific encoders, contrastive and domain-adversarial training, prototype fusion, and a HuBERT/Wav2Vec2 interpretability pipeline reached 78.3% test accuracy on unseen speakers.",
    "links": [
      [
        "GitHub",
        "https://github.com/arham-siddiqui/silent-speech-interpretability"
      ],
      [
        "Poster",
        "https://drive.google.com/file/d/1xHhZNLfurAyho5anMl13Zp7aPgUI7awr/view?usp=sharing"
      ]
    ]
  },
  "taskshift": {
    "title": "TaskShift",
    "dates": "Jun 2026",
    "description": "I built TaskShift as a research codebase for measuring how pretrained vision-model representations change under different objectives. In the current experiment, I compare the same DINOv2 ViT-S/14 backbone after training on passive recognition versus navigation affordance prediction from AI2-THOR egocentric indoor frames.",
    "links": [
      [
        "GitHub",
        "https://github.com/arham-siddiqui/TaskShift"
      ]
    ]
  },
  "curriculearn": {
    "title": "Curriculearn",
    "dates": "Jun 2026",
    "description": "I built Curriculearn as an AI-powered curriculum optimization system that treats a lesson like an input program and repeatedly evaluates, diagnoses, edits, and re-scores it against simulated cognitive-response metrics. Instead of generating lesson material from scratch, I designed the system to ingest teacher-authored PDFs, PowerPoints, Word documents, plain text, or raw lesson content, segment the material, convert each segment into a semantic brain-state representation, and use those trajectories to identify cognitive overload, weak concept flow, low retention support, and low multimodal reinforcement.",
    "links": [
      [
        "GitHub",
        "https://github.com/jshaha/Curriculearn-"
      ]
    ]
  },
  "apple-image-validation": {
    "title": "Apple Image Validation Backend",
    "dates": "Jan 2026 – May 2026",
    "description": "Built under contract for Apple, this cloud-native computer-vision platform spans image ingestion, distributed model inference, backend aggregation, and a web review interface. Asynchronous workers, message-queue scheduling, and multi-model scoring support concurrent processing, retries, failure isolation, configurable filtering, and human review.",
    "links": [
      [
        "GitHub",
        "https://github.com/Generative-AI-at-Berkeley/apple-sp26"
      ]
    ]
  },
  "deepmind-calendar-agent": {
    "title": "Google Gemini Calendar Agent",
    "dates": "Sep 2025 – Mar 2026",
    "description": "Built under contract for Google DeepMind, this Gemini-powered calendar agent adapts its autonomy from user trust signals. A Beta-Binomial estimator and Hybrid LinUCB controller use acceptance, edits, overrides, and uncertainty to move the agent along a constrained six-level autonomy ladder.",
    "links": [
      [
        "GitHub",
        "https://github.com/arham-siddiqui/deepmindtrustbandit"
      ],
      [
        "Report",
        "https://drive.google.com/file/d/1IaMvZWYHsVTkg4qxuARYHjinMlAsfYGb/view?usp=sharing"
      ]
    ]
  },
  "audio-modeling": {
    "title": "Spatial-Temporal Audio Modeling",
    "dates": "2025",
    "description": "I studied spatial-temporal audio modeling for auditory hazard classification, with the larger goal of identifying which neural architecture best detects safety-relevant sounds for visually impaired pedestrians. I framed audio hazard detection as a sequential classification problem: urban sounds contain both local spectral structure and time-dependent patterns, so my model needed to learn what a sound is made of and how it evolves over a short clip.",
    "links": [
      [
        "Paper",
        "https://drive.google.com/file/d/1QWZQWzyw2lvL7dsTVzgifarasgnO7Yx-/view"
      ]
    ]
  },
  "omar": {
    "title": "Overhead Movement Alarm Radar",
    "dates": "2021 – 2025",
    "description": "Designed a head-worn assistive device that converts ultrasonic obstacle measurements into directional haptic feedback. I iterated with the same blind user over four years, improving sensing, timing, comfort, and form factor before distributing the device to more than 50 blind students at the Hatlen Center.",
    "links": [
      [
        "GitHub",
        "https://github.com/orgs/overheadinitiative/repositories"
      ],
      [
        "Patent",
        "https://drive.google.com/file/d/1IsqUJUhZ8AhV0gP2z1cJfP_0TotN7TdU/view?usp=sharing"
      ]
    ]
  },
  "cometkitz": {
    "title": "CometKitz Robotics Kits Program",
    "dates": "Jan 2022 – Jun 2025",
    "description": "I built CometKitz through the Wilcox Robotics Team to make hands-on STEM learning more accessible for public-school students. I designed the project around a practical access problem: commercial robotics kits can cost hundreds of dollars, which limits how many classrooms can provide students with real engineering hardware. I addressed that gap by building lower-cost robotics kits, classroom-ready curriculum, and guided workshops that could be deployed directly into local elementary schools.",
    "links": [
      [
        "Website",
        "https://wilcox-robotics-team.com/cometkitz/"
      ],
      [
        "Feature",
        "https://www.nbcbayarea.com/news/local/bay-area-proud/south-bay-high-school-robotics-team-bringing-sport-to-next-generation/3461924/"
      ]
    ]
  },
  "santa-clara-coding-association": {
    "title": "Santa Clara Coding Association",
    "dates": "Mar 2021 – Jun 2025",
    "description": "I founded Santa Clara Coding Association as a city-wide computer science education initiative to make coding more accessible to students through clubs, workshops, hackathons, and structured curriculum. Through SCCA, I reached 1,500+ students and focused on helping beginners move from passive exposure to active programming through hands-on lessons in Python, Java, and core computational thinking.",
    "links": []
  },
  "bwsi-assistive-navigation": {
    "title": "Assistive Navigation Systems",
    "dates": "Feb 2024 – Aug 2024",
    "description": "I built StreetSmart through MIT Beaver Works Summer Institute as an assistive navigation perception system for visually impaired users. The project combined computer vision, environmental audio classification, and text-to-speech feedback into a Streamlit application that could take an image or audio clip, infer the relevant street sign or hazard, and turn that result into a spoken navigation cue. My goal was to move beyond a single-modality detector and build a prototype that could reason over both visual street context and acoustic hazards, because real navigation requires awareness of signs, moving vehicles, construction sounds, sirens, and spatial position at the same time.",
    "links": [
      [
        "GitHub",
        "https://github.com/arham-siddiqui/BWSICapstone"
      ]
    ]
  },
  "medical-testing": {
    "title": "Reactionary Effects of Medical Testing on Rodents",
    "dates": "2023",
    "description": "In A Machine Learning Approach to Examine the Reactionary Effects of Medical Testing on Rodents: A Comparative Analysis, I studied whether supervised classification can match a new post-injection rodent observation profile to the drug class most consistent with previously observed reaction patterns. I framed drug-response interpretation as a structured pattern-recognition problem, using behavioral and physiological proxy features collected across a 72-hour post-injection observation window.",
    "links": [
      [
        "Paper",
        "https://drive.google.com/file/d/11fWXFii5x58CW5lnXpjaRmcB6PSN2_9P/view?usp=sharing"
      ]
    ]
  },
  "csiro-climate-tech": {
    "title": "USA-Australia Climate Technology MOU",
    "dates": "Jul 2023",
    "description": "My CSIRO experience centered on research for a USA-Australia Climate Technology MOU, with emphasis on how machine learning and data systems can support climate infrastructure decisions. I connected technical climate-tech domains such as grid optimization, emissions quantification, ESG risk assessment, and AI policy into a policy-facing research product. My goal was to understand where AI could create measurable operational value while still fitting within public-sector, research, and international collaboration constraints.",
    "links": [
      [
        "MOU Document",
        "https://drive.google.com/file/d/1_jiD-_7O4Z4gR_ssvHjP_t0hHEDm2tTn/view?usp=sharing"
      ]
    ]
  },
  "phishing-risk": {
    "title": "Phishing Risk Classification",
    "dates": "2022",
    "description": "I built Phishing Risk Classification as a comparative machine-learning study focused on detecting malicious websites from structured URL and page-level indicators. I framed phishing mitigation as a supervised classification problem: given a fixed feature vector extracted from a suspicious website, predict whether the site should be treated as legitimate, suspicious, or phishing-risk aligned. I compared individual and ensemble classifiers to determine which architecture best balances accuracy, precision, recall, and F1-score for practical anti-phishing use.",
    "links": [
      [
        "Paper",
        "https://drive.google.com/file/d/16oNMado2GaJaP75GkoUNIX9YOVOqHVdo/view?usp=sharing"
      ]
    ]
  },
  "casting-defect": {
    "title": "Casting Defect Detection",
    "dates": "2022",
    "description": "I built Casting Defect Detection as a computer-vision study evaluating whether machine-learning models can automate quality inspection for manufactured casting parts. I treated defect inspection as a binary image-classification problem: given an image of a casting surface, classify it as defective or non-defective. I compared classical machine-learning approaches against sequential convolutional architectures to determine which model family was most viable for a constrained industrial defect-detection setting.",
    "links": [
      [
        "Paper",
        "https://drive.google.com/file/d/1WbAatQpwBvLNHQ37LbNRM69TbPMvFCpf/view?usp=sharing"
      ]
    ]
  }
};

const dialog = document.querySelector("#project-dialog");
const dialogTitle = document.querySelector("#project-dialog-title");
const dialogMeta = document.querySelector("#project-dialog-meta");
const dialogDescription = document.querySelector("#project-dialog-description");
const dialogLinks = document.querySelector("#project-dialog-links");
const closeButton = document.querySelector(".project-modal-close");
let lastTrigger = null;

function openProject(slug, trigger = null) {
  const project = projects[slug];
  if (!project) return;

  lastTrigger = trigger;
  dialogTitle.textContent = project.title;
  dialogMeta.textContent = project.dates;
  dialogDescription.textContent = project.description;
  dialogLinks.replaceChildren(
    ...project.links.map(([label, href]) => {
      const link = document.createElement("a");
      link.textContent = label;
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      return link;
    }),
  );

  window.history.replaceState(null, "", `#${slug}`);
  if (!dialog.open) dialog.showModal();
  window.requestAnimationFrame(() => dialogTitle.focus());
}

document.querySelectorAll("[data-project]").forEach((trigger) => {
  trigger.addEventListener("click", () => openProject(trigger.dataset.project, trigger));
});

closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  window.history.replaceState(null, "", window.location.pathname);
  window.requestAnimationFrame(() => lastTrigger?.focus());
});

const initialProject = window.location.hash.slice(1);
if (projects[initialProject]) openProject(initialProject);
