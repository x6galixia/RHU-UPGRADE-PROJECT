const servicesByCategory = {
    "Thoracic Content": [
       "3 views High waver and both laterals",
       "4 views",
       "Chest AP/PA (adult)",
       "Chest PAL",
       "Chest APL",
       "Apicrogam"
    ],
    "Blood Gases": [
      "Carbon dioxide (CO2)",
  
      "Oxygen (O2)",
      
      "Bicarbonate (HCO3)",
      
      "pH",
      
      "C-reactive protein (CRP)"
    ],
  
    "Clinical Microscopy": [
      "Urinalysis",
  
      "Fecalysis",
      
      "Semenalysis",
      
      "Direct sputum microscopy",
      
      "Acid-fast bacilli stain (AFB stain - hot method)",
      
      "Fecal occult blood (FOBT)",
      
      "H. pylori (fecal)"
    ],
    "Clinical Chemistry": [
      "Sodium (Na)",
  
      "Potassium (K)",
      
      "Chloride (Cl)",
      
      "Phosphate (PO4)",
      
     " Calcium (Ca)",
      
      "Fasting blood sugar (FBS)",
      
      "Random blood sugar (RBS)",
      
      "Total cholesterol",
      
      "High density lipoprotein (HDL)",
      
      "Low density lipoprotein (LDL)",
      
      "Very low density lipoprotein (VLDL)",
      
      "Triglycerides (TG)",
      
      "Creatinine",
      
      "Blood urea nitrogen (BUN)",
      
      "Blood uric acid (BUA)",
      
      "Alanine aminotransferase (ALT)",
      
      "Aspartate aminotransferase (AST)",
      
      "Indirect bilirubin (B1)",
      
      "Direct bilirubin (B2)",
      
      "Total bilirubin",
      
      "Total protein",
      
      "Albumin",
      
      "Globulin"
    ],
    "Hematology": [
      "Complete blood count (CBC)",
  
      "CBC with platelets",
      
      "Platelets",
      
      "Peripheral blood smear (PBS)",
      
     " Reticulocytes",
      
      "HbA1c",
      
      "Erythrocyte sedimentation rate (ESR)",
      
      "ABO typing",
      
      "Rh typing"
    ],
    "Special Test": [
      "Prostate-specific antigen (PSA)",
  
  "Beta HCG",
  
  "Pregnancy test, urine (PT)",
  
  "Triiodothyronine (T3)",
  
  "Thyroxine (T4)",
  
  "Thyroid stimulating hormone (TSH)",
  
  "Human immunodeficiency virus (HIV) antibody",
  
  "Hepatitis B surface antigen (HBsAg)",
  
  "Dengue NS1 antigen",
  
  "Dengue IgG antibody",
  
  "Dengue IgM antibody",
  
  "Dengue NS1 and IgG-IgM combo",
  
  "Rapid plasma reagin (RPR)",
  
  "Typhidot",
  
  "H. pylori, blood"
    ],
    "Other Skeletal": [
      "Shoulder joint (Internal and external rotation)",
  
      "T-cage/Chest Bucky",
  
      "Clavicle",
  
      "Scapula (AP and axial)",
  
      "Sternum (Oblique and lateral",
  
      "Humerus APL",
  
      "Elbow joint APL",
  
      "Forearm APL",
  
      "Wrist APL",
      "Hand APO",
      "Pelvis AP",
      "Hi joint APL",
      "Femur APL",
      "Knee joint APL",
      "Leg APL",
      "Ankle join APL",
      "Oscalis APL",
      "Foot APO"
    ],
    "Head": [
      "Skull (APL)",
  
      "Mastoid (3 views - Towns and both sides modified Law views",
  
      "Optic Foramen",
  
      "Paranal sinuses [3 views - modified PNS (Caldwell's Water and Lateral view)]",
  
      "Orbit, per orbit (2 views - straight PA and 5 deg. andle cephalad)",
  
      "Maxilla/Mandible (2 views - PA and both latero-oblique",
  
      "Nasal Bone (3 views - high Water's and both laterals)",
  
      "Temporaro-mandibular joint (4-views - Schuller's view close/open mouth both sides)",
  
      "Zygoma (Town's, Water's and Axial views)"
    ],
  
    "Vertebral Column": [
      "Cervical APL",
  
      "Thoraic APL",
  
      "Thorac-lumbar APL",
  
      "Lumbar APL",
  
      "Sacrum or Coccyx APL"
  
    ],
    "Abdomen": [
      "Plain abdomen/KUB",
  
      "Abdomen (Flat plate and upright views)",
    ],
  
    "Blood Chemistry": [
      "Fasting Blood Sugar (FBS)",
      "Random Blood Sugar/HGT",
      "Blood Urea Nitrogen (BUN)",
      "Creatine",
      "Blood Uric Acid (BUA)",
      "Lipid Profile",
      "Total Cholesterol Only",
      "HDL Cholesterol Only/LDL only",
      "Triglycerides Only",
      "SGPT/ALT",
      "SGOT/AST",
      "Sodium (NA+)",
      "Potassium (K+)",
      "Chloride(CI-)",
      "Phosphorus/Phosphate(P4)",
      "Albumin",
      "B1,B2, Total Bilirubin ",
      "Drug Test",
  
    ],
    // Add more categories and services here
  };
  
  function updateServices(categoryDropdown) {
    const selectedCategory = categoryDropdown.value;
    const serviceDropdown = categoryDropdown.parentElement.querySelector('.service-dropdown');
  
    // Clear existing options
    serviceDropdown.innerHTML = '<option value="default" disabled selected>Select a service</option>';
  
    // Get services for the selected category
    const services = servicesByCategory[selectedCategory];
  
    // Populate service dropdown
    if (services) {
       services.forEach(service => {
          const option = document.createElement('option');
          option.value = service;
          option.textContent = service;
          serviceDropdown.appendChild(option);
       });
    }
  }
  
  function addCategoryFields() {
    const container = document.getElementById('category-fields-container');
    const newField = container.firstElementChild.cloneNode(true);
    container.appendChild(newField);
  }
  