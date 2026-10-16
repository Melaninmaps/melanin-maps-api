import type { ProfileEnrichmentManifest } from "../businesses/kinfolkCurrentProfileEnrichment";

/**
 * Immutable approved 2026-10-16 batch of externally verified, source-documented
 * non-Kinfolk Latino / Hispanic profiles. This is the server-side authority for
 * the one-time 62-profile creation workflow; browser input cannot alter it.
 */
export const REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_MANIFEST: ProfileEnrichmentManifest =
  {
    version: "profile-enrichment-v2",
    scope: "non_kinfolk_current",
    batchId: "reviewed-nonkinfolk-latino-profile-create-2026-10-16",
    generatedAt: "2026-10-16T00:49:00-04:00",
    candidates: [
      {
        businessId: "source-receipt:026b094a61c090114cc061cbb7a9256957ad9448",
        expectedIdentity: {
          name: "Sea Philly",
          city: "Philadelphia",
          state: "PA",
          website: "https://www.seaphilly.us/",
        },
        patch: {
          website: "https://www.seaphilly.us/",
          description:
            "Sea Philly offers private and specialty boat cruises on the Delaware River and Schuylkill River in Philadelphia, including luxury charters, day & sunset cruises, and private excursions.",
          phone: "267.899.2469",
          tags: [
            "private cruises",
            "sunset cruises",
            "boat charters",
            "event space",
            "photoshoots",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.seaphilly.us/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.seaphilly.us/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "SEA PHILLY SERVICES LUXURY CHARTERS Enjoy 1.5 hour day & sunset cruises or 4 - 6 hour private excursions, for up to six guests.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.seaphilly.us/aboutus",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "CONTACT US 267.899.2469",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.seaphilly.us/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Our private dock doubles as an intimate event space for corporate events, bridal toasts, and birthdays. The space accommodates a max of 80 guests Go to SPECIAlTY CRUISES Proposals, South Asian Weddings, and Photoshoots on our classic wood vessels make the perfect, unique setting.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:0ac163b1390320104aa494e6da004c15a5ba24fdb3fd388563cd41c4cc83cc35",
        expectedIdentity: {
          name: "540 Security and Safety Inc.",
          city: "Bronx",
          state: "NY",
          website: "https://www.540securityandsafety.com/",
        },
        patch: {
          website: "https://www.540securityandsafety.com/",
          description:
            "540 Security and Safety, Inc. provides training programs and consulting services in security, threat assessment, and emergency management, based on neuroscience and behavioral science.",
          phone: "+1 347 432 7498",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.540securityandsafety.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://540securityandsafety.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"At 540 Security and Safety, we are passionate about providing cutting-edge solutions for security and emergency management. Our team of experts utilizes the latest evidence-based research in neuroscience and behavioral science to develop comprehensive training programs and consulting services..."',
          },
          {
            field: "phone",
            sourceUrl: "https://540securityandsafety.com/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"CONTACT INFO +1 347 432 7498 contact@540securityandsafety.com PO Box 727, New York, NY 10026, United States"',
          },
        ],
      },
      {
        businessId:
          "source-receipt:0def310255083ac96207970f33d15f607d3c1aff3fec6494f29500d96b14a86f",
        expectedIdentity: {
          name: "Cinematic Brothers Enterprise LLC",
          city: "Bronx",
          state: "NY",
          website: "https://www.cinematicbrothersenterprises.com/",
        },
        patch: {
          website: "https://www.cinematicbrothersenterprises.com/",
          description:
            "Cinematic Brothers Enterprises LLC provides staffing, authorized distribution, and project management services, and supplies consumables including paper, hygiene systems, janitorial supplies, PPE, and facility disposables.",
          hours: "Open today 09:00 am – 05:00 pm",
          phone: "Office: 646-468-9800",
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.cinematicbrothersenterprises.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://cinematicbrothersenterprises.com/about-us",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Cinematic Brothers Enterprises LLC. is a MBE Certified owned Small Business and HUBZone Certified Business that provides Staffing, Authorized Distribution and Project Management services for a combined 10+ years. We specialize in supplying essential, high-use consumables—including paper and hygiene systems, janitorial supplies, PPE, and facility disposables—through reliable national distribution partners.",',
          },
          {
            field: "phone",
            sourceUrl: "https://cinematicbrothersenterprises.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Cinematic Brothers Enterprises LLC Office: 646-468-9800","',
          },
          {
            field: "hours",
            sourceUrl: "https://cinematicbrothersenterprises.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Hours Open today 09:00 am – 05:00 pm","',
          },
        ],
      },
      {
        businessId:
          "source-receipt:0e7ec63279a1eee1d58d82ab93f55aec8f201d36ec7d8a6cdce9ea33c323a2c9",
        expectedIdentity: {
          name: "Brooklyn Radio Dispatcher Inc.",
          city: "Woodhaven",
          state: "NY",
          website: "https://www.brooklynradiodispatcher.com/",
        },
        patch: {
          website: "https://www.brooklynradiodispatcher.com/",
          description:
            "Coordinates non-emergency medical transportation (NEMT) and provides car service and airport drop-offs in New York City.",
          phone: "(718) 384-7070",
          tags: [
            "non-emergency medical transportation",
            "car service",
            "airport drop-offs",
            "dispatching",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.brooklynradiodispatcher.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.brooklynradiodispatcher.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "NEMT and car service in New York City Brooklyn Radio Dispatcher coordinates non-emergency medical transportation and car service in New York City.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.brooklynradiodispatcher.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Call us at (718) 384-7070 !",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.brooklynradiodispatcher.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "NEMT and car service in New York City Brooklyn Radio Dispatcher coordinates non-emergency medical transportation and car service in New York City.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:0fceb40a1638249b6c6bbbefc7a1d2ac983e2d9d2c6b6aa363779b9adee3ee5f",
        expectedIdentity: {
          name: "A&H Security Services, LLC",
          city: "Bronx",
          state: "NY",
          website: "https://www.aandhsecurity.com/",
        },
        patch: {
          website: "https://www.aandhsecurity.com/",
          hours: "Open 24 / 7, 365 days a week",
          phone: "(718) 292-3014",
        },
        fieldModes: {
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.aandhsecurity.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://aandhsecurity.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "(718) 292-3014",
          },
          {
            field: "hours",
            sourceUrl: "https://aandhsecurity.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Open 24 / 7, 365 days a week",
          },
        ],
      },
      {
        businessId:
          "source-receipt:1060acf049858d41509722f0bff1959dc59aed0a9ba16623e26786db75fd04fb",
        expectedIdentity: {
          name: "Aktiv Innovations LLC",
          city: "Corona",
          state: "NY",
          website: "https://alexcespedes.com/aktivinnovationsllc/",
        },
        patch: {
          website: "https://alexcespedes.com/aktivinnovationsllc/",
          description:
            "Aktiv Innovations LLC is a business consulting services company founded in 2014 that helps businesses optimize operations, raise capital, and grow their digital footprint.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://alexcespedes.com/aktivinnovationsllc/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://alexcespedes.com/aktivinnovationsllc/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Aktiv Innovations LLC is a business consulting services company founded in 2014 by Alex Cespedes. From its inception, the goal of Aktiv Innovations has been to help businesses optimize their operations, raise capital, and grow their digital footprint."',
          },
        ],
      },
      {
        businessId:
          "source-receipt:117bf132e3f3cad4d046640d948c5831afce58415b01212ea2ad80dccd0f737e",
        expectedIdentity: {
          name: "Counseling Space LCSW PC",
          city: "Forest Hills",
          state: "NY",
          website: "https://www.counselingpc.com/",
        },
        patch: {
          website: "https://www.counselingpc.com/",
          description:
            "Counseling and wellness services including clinical therapy and consulting for business owners, managers, and professionals, and online workshops and courses.",
          hours: "Counseling Space currently holds flexible hours.",
          phone: "718-540-7868",
          tags: [
            "therapy",
            "counseling",
            "wellness consulting",
            "online workshops",
            "employee wellbeing",
          ],
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.counselingpc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.counselingpc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Counseling Services Counseling and wellness consulting for business owners and managers eager to prevent or reduce symptoms of anxiety, depression and burnout.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.counselingpc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Office: 718-540-7868",
          },
          {
            field: "hours",
            sourceUrl: "https://www.counselingpc.com/faq",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "medium",
            note: "Counseling Space currently holds flexible hours.",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.counselingpc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Counseling Services Counseling and wellness consulting for business owners and managers eager to prevent or reduce symptoms of anxiety, depression and burnout.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:192aea20dd1f998c8cd4aa43bd434a608c90fd664aea3cf10583fc2cc77fe26f",
        expectedIdentity: {
          name: "Agape Printing Plus, Corp.",
          city: "Bronx",
          state: "NY",
          website: "https://www.agapeprintingplus.com/",
        },
        patch: {
          website: "https://www.agapeprintingplus.com/",
          description: "Printing services and related offerings.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.agapeprintingplus.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.agapeprintingplus.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "medium",
            note: "AGAPE PRINTING PLUS | WE'RE OPEN",
          },
        ],
      },
      {
        businessId:
          "source-receipt:238682da24489e39c259dc2dfb86872c9bc0e65fab8b7c5a9904b19290c3d138",
        expectedIdentity: {
          name: "Carpio Media LLC",
          city: "Forest Hills",
          state: "NY",
          website: "https://carpiomedia.com/",
        },
        patch: {
          website: "https://carpiomedia.com/",
          description:
            "Carpio Media creates FAA compliant drone photography, cinematic video, FPV fly throughs, and visual content for real estate professionals, brands, agencies, production teams, events, and organizations.",
          phone: "(929)350-0095",
          tags: [
            "drone photography",
            "cinematic video",
            "fpv",
            "real estate photography",
            "visual content creation",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://carpiomedia.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.carpiomedia.com/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "“Carpio Media creates FAA compliant drone photography, cinematic video, FPV fly throughs, and visual content for real estate professionals, brands, agencies, production teams, events, and organizations across Queens, New York City, Long Island, Westchester, New Jersey, and Connecticut.”",
          },
          {
            field: "phone",
            sourceUrl: "https://www.carpiomedia.com/services-nyc-media",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Forest Hills, NY (929)350-0095 Info@CarpioMedia.com"',
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.carpiomedia.com/services-nyc-media",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Choose the service that fits your production: residential or commercial real estate photography, branded visual content, immersive FPV, or cinematic drone work for film and television."',
          },
        ],
      },
      {
        businessId:
          "source-receipt:263e5cabe5fdb51180ce406f14704d9465239ee0444b0b6c54749c61f47a8a92",
        expectedIdentity: {
          name: "Biform, LLC",
          city: "Forest Hills",
          state: "NY",
          website: "https://www.biformarchitecture.com/",
        },
        patch: {
          website: "https://www.biformarchitecture.com/",
          description:
            "Biform is a team of architects, interior designers, engineers and drafters that provides interdisciplinary architectural project services.",
          phone: "+718 3610738",
          tags: [
            "architectural services",
            "schematic design",
            "design development",
            "construction documents",
            "construction administration",
            "procurement",
            "interior design",
            "architectural survey",
            "millwork shop drawings development",
            "photography",
            "bim asset management",
            "bim/cad drafting and modeling 2d and 3d modeling",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.biformarchitecture.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.biformarchitecture.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "biform ® is a TEAM of experienced Architects, Interior Designers, Engineers and Drafters who understand the importance of interdisciplinary collaboration in architectural projects with other practices and professionals.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.biformarchitecture.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "+718-3610738",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.biformarchitecture.com/services/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Services Biform Architecture > Services | Architectural services Our team is ready to assist you throughout the different phases of an architectural project until its completion. Schematic design Where ideas and necessities come together creating the basic concept of your project. Design Development An exciting time during the lifecycle of a project, where the schematics are finalized, selection of materials taken place and general exterior and interior design are chosen. Construction Documents With all design selection in place, Architects, Interior Designers, Engineers, and all related disc",
          },
        ],
      },
      {
        businessId:
          "source-receipt:2bfb8800ab6fb4df0728def52bd3e1f72a0e53747cc3241c4da550a9e819b74d",
        expectedIdentity: {
          name: "Cotel Business Solution Inc.",
          city: "Woodside",
          state: "NY",
          website: "https://cotel.com/",
        },
        patch: {
          website: "https://cotel.com/",
          description:
            "Cotel Business Solutions provides telecom, security, and cabling system integration and installation services for commercial and residential customers in New York, NY.",
          phone: "212-465-8989",
          tags: [
            "surveillance security systems",
            "door access control",
            "telephone systems",
            "wi-fi access points",
            "fiber optic cabling",
            "audio & visual integrations",
            "intercom systems",
            "structured voice & data cabling",
            "home & business automation",
            "point-of-sale systems",
            "network cabling",
            "fire alarm monitoring",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://cotel.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://cotel.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "We are the Industry Experts at Installing Structured Cabling and Network Systems Cotel specializes in full systems installations in the New York area.",
          },
          {
            field: "phone",
            sourceUrl: "https://cotel.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Retail Store 212-465-8989",
          },
          {
            field: "service_tags",
            sourceUrl: "https://cotel.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Solutions Overview Surveillance Security Systems Door Access Control Telephone Systems Wi-Fi Access Points Fiber Optic Cabling Audio & Visual Integrations Intercom Systems Structured Voice & Data Cabling Home & Business Automation Point-Of-Sale Systems",
          },
        ],
      },
      {
        businessId:
          "source-receipt:30bd8e9d323641c371531ca555417b8714fc62b0e29b943b0e8114e5c4d48e9d",
        expectedIdentity: {
          name: "C. B. Mills Electric LLC",
          city: "Staten Island",
          state: "NY",
          website: "https://www.cbmillselectric.com/",
        },
        patch: {
          website: "https://www.cbmillselectric.com/",
          hours: "Open today 08:00 am – 04:00 pm",
          phone: "Main Office: 718-381-1081",
        },
        fieldModes: {
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.cbmillselectric.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://cbmillselectric.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Main Office: 718-381-1081",
          },
          {
            field: "hours",
            sourceUrl: "https://cbmillselectric.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Hours Open today 08:00 am – 04:00 pm",
          },
        ],
      },
      {
        businessId:
          "source-receipt:43d2559db0511845f403f67d55d145699402adf24c208eb458cb89cba1adff09",
        expectedIdentity: {
          name: "Apex Architectural Metal & Glass Systems Corp.",
          city: "Corona",
          state: "NY",
          website: "https://apexglass.co/",
        },
        patch: {
          website: "https://apexglass.co/",
          description:
            "Apex Architectural Metal & Glass Systems Corp provides glass tempering and laminating and CNC laser services.",
          phone: "718.606.2517",
          tags: ["glass tempering", "glass laminating", "cnc laser"],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://apexglass.co/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.apexglass.co/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Apex Metal & Glass New York. Glass Tempering & Laminating. CNC Laser",
          },
          {
            field: "phone",
            sourceUrl: "https://www.apexglass.co/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Tel: 718.606.2517",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.apexglass.co/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Apex Metal & Glass New York. Glass Tempering & Laminating. CNC Laser",
          },
        ],
      },
      {
        businessId:
          "source-receipt:44cdb493dc8ae71456f021c598f679495b4abd77d092b9b555687e71fbbb84ae",
        expectedIdentity: {
          name: "Colonna Marble Corporation",
          city: "Bronx",
          state: "NY",
          website: "https://www.colonnamarble.com/",
        },
        patch: {
          website: "https://www.colonnamarble.com/",
          hours: "Office hours: Monday thru Friday 8:00 am to 5:00 pm EST.",
          phone: "Phone # 718-860-4800",
        },
        fieldModes: {
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.colonnamarble.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.colonnamarble.com/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Phone # 718-860-4800",
          },
          {
            field: "hours",
            sourceUrl: "https://www.colonnamarble.com/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Office hours: Monday thru Friday 8:00 am to 5:00 pm EST.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:45891dd82c6a04c516bdef4a20c826bd56a5ce45f042cc00b691999719a4e5a5",
        expectedIdentity: {
          name: "CGM Renovations Inc.",
          city: "Staten Island",
          state: "NY",
          website: "https://www.cgmorgan.com/",
        },
        patch: {
          website: "https://www.cgmorgan.com/",
          description:
            "Since 2017, CGM has provided interior and exterior renovations, repairs, and construction management supervision and leadership.",
          phone: "917.969.2463",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.cgmorgan.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.cgmorgan.com/about-us",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Since 2017, CGM has provided the highest quality of services which include interior and exterior renovations, repairs, and construction management supervision and leadership.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.cgmorgan.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "cgmorgan2020@gmail.com | 917.969.2463",
          },
        ],
      },
      {
        businessId:
          "source-receipt:4df66f3cfce31c4e3e66b073594ceeb40b9ae0be8fd54457b11c8299b794e186",
        expectedIdentity: {
          name: "V. Cloud Painting and Contracting Corp.",
          city: "Corona, NY",
          state: "NY",
          website: "https://www.v-cloud.com/",
        },
        patch: {
          website: "https://www.v-cloud.com/",
          phone: "1-800-799-8979",
        },
        fieldModes: {
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.v-cloud.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.v-cloud.com/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Phone support is available from 8:30 a.m. - 5:00 p.m. 1-800-799-8979"',
          },
        ],
      },
      {
        businessId:
          "source-receipt:519d5d7575f79bc363db094a9df601cedad001c293a8c9c23c4c892e44ce4087",
        expectedIdentity: {
          name: "Neat Commercial Cleaning Corp.",
          city: "Woodhaven",
          state: "NY",
          website: "https://neatcommercial.com/",
        },
        patch: {
          website: "https://neatcommercial.com/",
          description:
            "Specializing in event and commercial cleaning services in New York City; serving commercial, residential, and real estate clients.",
          hours:
            "Our business operates seven days a week with daily hours from 6 am to 12 am.",
          tags: [
            "event cleaning",
            "commercial cleaning",
            "office cleaning",
            "deep cleaning",
            "residential cleaning",
            "construction site cleaning",
            "move in/move out cleaning",
            "spring cleaning",
          ],
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://neatcommercial.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://neatcommercial.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Specializing in event and commercial cleaning services in New York City, we serve commercial, residential, and real estate clients.",
          },
          {
            field: "hours",
            sourceUrl: "https://neatcommercial.com/faqs",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Our business operates seven days a week with daily hours from 6 am to 12 am.",
          },
          {
            field: "service_tags",
            sourceUrl: "https://neatcommercial.com/services",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Services Event Cleaning Pre- event Post- event Production cleaning Office Cleaning Day-to-day cleaning and Maintenance (weekly/biweekly/monthly) Deep cleaning Residential Cleaning Move in/ Move out Day-to-day cleaning and Maintenance Spring cleaning Deep cleaning Construction Site Cleaning Final clean (Phase one) Light clean (Phase two)",
          },
        ],
      },
      {
        businessId:
          "source-receipt:51c3f632b54540868f7b7f1a4c5a72f9406cdcc78582743305ae67b96a3cd98f",
        expectedIdentity: {
          name: "GT Business Supplies LLC",
          city: "South Ozone Park",
          state: "NY",
          website: "http://www.gttoner.com/",
        },
        patch: {
          website: "http://www.gttoner.com/",
          description:
            "Supplier of office supplies, laser toner, printers, service and repairs.",
          hours:
            "Mon 09:00 am – 05:00 pm; Tue 09:00 am – 05:00 pm; Wed 09:00 am – 05:00 pm; Thu 09:00 am – 05:00 pm; Fri 09:00 am – 05:00 pm; Sat Closed; Sun Closed",
          phone: "718-659-9165",
          tags: [
            "office supplies",
            "laser toner",
            "printer repairs",
            "printer sales",
            "tech products",
            "janitorial supplies",
          ],
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://www.gttoner.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://gttoner.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Home Office Supplies Laser Toner Sales Service & Repairs Tech. Products",
          },
          {
            field: "phone",
            sourceUrl: "https://gttoner.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "TO ORDER CALL:718-659-9165",
          },
          {
            field: "hours",
            sourceUrl: "https://gttoner.com/contact-us%3A",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "GT Business Supplies Hours Mon 09:00 am – 05:00 pm Tue 09:00 am – 05:00 pm Wed 09:00 am – 05:00 pm Thu 09:00 am – 05:00 pm Fri 09:00 am – 05:00 pm Sat Closed Sun Closed",
          },
          {
            field: "service_tags",
            sourceUrl: "https://gttoner.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Home Office Supplies Laser Toner Sales Service & Repairs Tech. Products",
          },
        ],
      },
      {
        businessId:
          "source-receipt:560a63234c9c05075eabb1ba19da14e122b9e2f5865c155ef86b219b63bdda4b",
        expectedIdentity: {
          name: "Rivera-Robles & Montes CPA, PLLC",
          city: "NEW YORK",
          state: "NY",
          website: "https://riveramontes.cpa/",
        },
        patch: {
          website: "https://riveramontes.cpa/",
          description:
            "Rivera & Montes CPA is an accounting firm focused on helping businesses to achieve their financial goals; it offers accounting, tax, finance, audit, and advisory services and assists foreign-based businesses with expansion in the United States.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://riveramontes.cpa/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.riveramontes.cpa/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Rivera & Montes CPA is an accounting firm focused on helping businesses to achieve their financial goals. We offer a realm of accounting, tax, finance, audit, and advisory services that help our clients efficiently run and grow their businesses and organizations. We also help foreign-based businesses with expansion in the United States.",
          },
        ],
      },
      {
        businessId: "source-receipt:5853348a444b9d79bb50d134a6ffc1c0494f0f94",
        expectedIdentity: {
          name: "Angelina's Quince Couture, L.L.C",
          city: "Pearland",
          state: "TX",
          website: "http://www.aqcouture.com/",
        },
        patch: {
          website: "http://www.aqcouture.com/",
          description:
            "Angelina’s Quince Couture is a premier Quinceañera and formalwear boutique located in Pearland, Texas, proudly serving Houston and the surrounding areas.",
          phone: "(832) 207-0534",
          tags: [
            "quinceañera dresses",
            "formalwear",
            "prom",
            "homecoming",
            "debut",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://www.aqcouture.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://aqcouture.com/about-us/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Angelina’s Quince Couture is a premier Quinceañera and formalwear boutique located in Pearland, Texas, proudly serving Houston and the surrounding areas."',
          },
          {
            field: "phone",
            sourceUrl: "https://aqcouture.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "(832) 207-0534",
          },
          {
            field: "service_tags",
            sourceUrl: "https://aqcouture.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Angelina’s Quince Couture is also your one-stop destination for all things celebration. From Quinceañera and Homecoming to Debut and Prom, we carry stunning collections designed to make every moment unforgettable."',
          },
        ],
      },
      {
        businessId:
          "source-receipt:590c21b00aea41606b1983eb2831e5839084489582b68ad85ee93c7d010482f8",
        expectedIdentity: {
          name: "RNC Industries LLC",
          city: "Holtsville",
          state: "NY",
          website: "https://www.rncnewyork.com/",
        },
        patch: {
          website: "https://www.rncnewyork.com/",
          description:
            "RNC Industries provides integrated concrete construction services in New York City and the surrounding areas, specializing in excavation, foundations, and superstructure concrete.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.rncnewyork.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://rncnewyork.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "RNC Industries provides integrated concrete construction services in New York City and the surrounding areas.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:5ca8d6f0e232071edc1fbd2ba915212c451f530dc87a729a07d462d58b0b476a",
        expectedIdentity: {
          name: "Selecta Solutions LLC",
          city: "Rego Park",
          state: "NY",
          website: "https://www.selectanyc.com/",
        },
        patch: {
          website: "https://www.selectanyc.com/",
          description:
            "Selecta Solutions offers PTAC / HVAC maintenance, repair, and new unit sales for commercial, residential, and hotel/leisure clients in the Greater New York City area.",
          hours:
            "Mon 09:00 am – 05:00 pm; Tue 09:00 am – 05:00 pm; Wed 09:00 am – 05:00 pm; Thu 09:00 am – 05:00 pm; Fri 09:00 am – 05:00 pm; Sat 09:00 am – 12:00 pm; Sun Closed",
          phone: "(646) 822-4551",
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.selectanyc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://selectanyc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Selecta Solutions offers PTAC / HVAC Maintenance, Repair, and New Unit Sales",
          },
          {
            field: "phone",
            sourceUrl: "https://selectanyc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "(646) 822-4551",
          },
          {
            field: "hours",
            sourceUrl: "https://selectanyc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Hours Mon 09:00 am – 05:00 pm Tue 09:00 am – 05:00 pm Wed 09:00 am – 05:00 pm Thu 09:00 am – 05:00 pm Fri 09:00 am – 05:00 pm Sat 09:00 am – 12:00 pm Sun Closed",
          },
        ],
      },
      {
        businessId:
          "source-receipt:5ec5af62b3e408292890a0a1e03959fbfd020357da19cd4c022b97ebe3f06dfd",
        expectedIdentity: {
          name: "CARA Construction Management, Inc.",
          city: "Bronx",
          state: "NY",
          website: "https://www.caracm.com/",
        },
        patch: {
          website: "https://www.caracm.com/",
          description:
            "CARA Construction Management is a construction management firm offering monitoring, supervision, on-site management, code & zoning professionals, filing representatives, and project managers for new construction, modernization, and renovation projects across educational, commercial, residential, transportation, and institutional sectors.",
          phone: "(646) 523-3412",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.caracm.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://caracm.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "CARA Construction Management offers monitoring, supervision, and on-site management. Our staff includes code & zoning professionals, filing representatives (“expediters”), and project managers.",
          },
          {
            field: "phone",
            sourceUrl: "https://caracm.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "(646) 523-3412",
          },
        ],
      },
      {
        businessId:
          "source-receipt:61d43d0ebd914db02c4971dd11ca35e32910ca4a8e19f3ba03c8d957c64a1685",
        expectedIdentity: {
          name: "ACJ Partners LLC",
          city: "Rego Park",
          state: "NY",
          website: "https://acjpartnersnyc.com/",
        },
        patch: {
          website: "https://acjpartnersnyc.com/",
          description:
            "ACJ Partners LLC specializes in creating signage solutions including design, production, and installation for residential and commercial projects in the NY Tri-state area.",
          hours:
            "Monday — Friday 7:00am - 6:00pm; Saturday — Sunday 9:00am - 12:00pm",
          phone: "347-738-3216",
          tags: [
            "signage",
            "design",
            "production",
            "installation",
            "ada braille signage",
            "vinyl lettering",
            "banner stands",
            "aluminum letters",
            "panel signs",
            "outdoor banners",
          ],
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://acjpartnersnyc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.acjpartnersnyc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "At ACJ Partners LLC, we specialize in creating high-quality signage solutions for residential and commercial projects across the NY Tri-state area. Our team offers end-to-end services, from design and production to seamless installation, ensuring that each project is completed to the highest standards of quality and professionalism.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.acjpartnersnyc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "347-738-3216",
          },
          {
            field: "hours",
            sourceUrl: "https://www.acjpartnersnyc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Hours Monday — Friday 7:00am - 6:00pm Saturday — Sunday 9:00am - 12:00pm",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.acjpartnersnyc.com/services",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Temporary Signage Stainless Steel Lettering ADA Braille Signage & Engraving Retractable Banner Stands 3M Vinyl Lettering Plaques Tear Drop & Blade Banners Flat Cut Aluminum Letters Panel Signs Photoluminescent Signs Brushed Aluminum – Metal Engraved Corrugated Plastic – Pre-Construction Signs Indoor & Outdoor Banners",
          },
        ],
      },
      {
        businessId:
          "source-receipt:649a2f51e54a189c4a7f9870a18e7d8b7c6319f1f2e6c1a0edebfce5d0f316f8",
        expectedIdentity: {
          name: "CES Consultants, Inc.",
          city: "Staten Island",
          state: "NY",
          website: "https://www.cesconsult.com/",
        },
        patch: {
          website: "https://www.cesconsult.com/",
          description:
            "CES CONSULTANTS, INC. is a full-service professional engineering, program management, construction management, construction inspection, design-build, progressive design-build, and program controls and technology firm.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.cesconsult.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://cesconsult.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"CES CONSULTANTS, INC. is a full-service professional engineering, program management, construction management, construction inspection, design-build, progressive design-build, and program controls and technology firm that believes in valued partnerships and proven solutions.",',
          },
        ],
      },
      {
        businessId:
          "source-receipt:674449849266eaeaba00b8e574b13253236b1b27c78f8668072ba027049f18fb",
        expectedIdentity: {
          name: "C.C.C. Renovation Inc.",
          city: "Long Island City",
          state: "NY",
          website: "https://www.cccrenovation.com/",
        },
        patch: {
          website: "https://www.cccrenovation.com/",
          description:
            "A company performing townhouse, commercial and residential interior, exterior and historical restoration work, including waterproofing, restoration and roofing services.",
          phone: "(718) 383-1220",
          tags: [
            "exterior facades",
            "brick work",
            "stone work",
            "lintels",
            "waterproofing",
            "window replacement and repairs",
            "power washing",
            "pointing",
            "cornices",
            "roofing",
            "liquid membrane",
            "membrane roof paver roof built-up roof (bur) membranes','metal panel roof','poly",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.cccrenovation.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.cccrenovation.com/about-us/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Our company was established in 2003, performing high-end townhouse, commercial and residential interior/exterior/historical restoration work encompassing the New York, New Jersey and Tri-state areas.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.cccrenovation.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Press to Call Phone.: (718) 383-1220",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.cccrenovation.com/services/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "EXTERIOR FACADES: Restoration of historical landmark buildings Brick Work, Stone Work, Lintels, Waterproofing Window Replacement and Repairs Power washing Pointing Cornices ROOFING: Liquid Membrane Plastic (Decothane, Kemperol, Alsan, Carlisle) Membrane Roof Paver Roof Built-up roof (BUR) Membranes Metal Panel Roof Systems for Low-Slope Polymer-Modified Bitumen Sheet Membranes Single-Ply Membranes Thermoplastic Membranes (e.g. PVC,TPO) Thermoset Membranes (e.g., EPDM)",
          },
        ],
      },
      {
        businessId: "source-receipt:7546882474773c7dd389f69e19617a408bf10cb8",
        expectedIdentity: {
          name: "Agility Insurance Services",
          city: "Richardson",
          state: "TX",
          website: "http://enrollinsurance.com/",
        },
        patch: {
          website: "http://enrollinsurance.com/",
          description:
            "Agility Insurance Services provides contracting, training, marketing, commissions, enrollment support and related services for life and health insurance agents and brokers.",
          phone: "(866) 590-9771",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://enrollinsurance.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.enrollinsurance.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Leading the nation in life and health insurance agent contracting, training, resources, commissions, enrollment support and beyond."',
          },
          {
            field: "phone",
            sourceUrl: "https://www.enrollinsurance.com/get-in-touch",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Tel: (866) 590-9771"',
          },
        ],
      },
      {
        businessId:
          "source-receipt:7a6233736b87806696e063042a15f6e6a74d13521a42be635986eb01f9231d5f",
        expectedIdentity: {
          name: "Business Relocation Services, Inc.",
          city: "Rockaway Park",
          state: "NY",
          website: "http://www.brsmove.com/",
        },
        patch: {
          website: "http://www.brsmove.com/",
          description:
            "Business Relocation Services is a facility relocation project management and moving services company that specializes in corporate and institutional relocations, including office, school, and IT/data center moves.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://www.brsmove.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://brsmove.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: '"Business Relocation Services INC. BRS is a facility relocation project management and a moving services company all in one."',
          },
        ],
      },
      {
        businessId:
          "source-receipt:7bd47dc43e4b1427ff49719c3ecee0814392bef90ccf16097d112f71a53468e1",
        expectedIdentity: {
          name: "Blanco Design, Inc.",
          city: "Beechurst",
          state: "NY",
          website: "https://www.blancodesigninc.com/",
        },
        patch: {
          website: "https://www.blancodesigninc.com/",
          phone: "+1 718-407-0078",
          description: "New site under construction.",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.blancodesigninc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.blancodesigninc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "New site under construction 00 Days 00 Hours 00 Minutes 00 Seconds",
          },
          {
            field: "phone",
            sourceUrl: "https://www.blancodesigninc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "blanco design +1 718-407-0078 New site under construction 00 Days 00 Hours 00 Minutes 00 Seconds",
          },
        ],
      },
      {
        businessId:
          "source-receipt:7ca2b6fbb608c3c99974c996270a8d9cfd7ab9d6ff786f571b1662b62b7f1c9e",
        expectedIdentity: {
          name: "AVID NYC Corp.",
          city: "Brooklyn",
          state: "NY",
          website: "https://www.avidnyc.com/",
        },
        patch: {
          website: "https://www.avidnyc.com/",
          description:
            "AVID NYC Corp. offers pre-construction, construction, and post-construction services, and works with architects and designers on building and restoration projects.",
          phone: "718-490-7781",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.avidnyc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://avidnyc.com/services",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "We Do It All Pre-Construction This phase includes constant monitoring and interaction. We keep an eye on budgets to ensure the lowest costs, stay on top of schedules for timely delivery and work closely with the design team to create your vision. Construction Working with trusted subcontractors, we keep them accountable throughout the entire build. From sequence to production and quality control, we stay focused on the goal. Post-Construction The last step in any build. This phase includes site cleanup, systems training, final inspections and move-in coordination.",
          },
          {
            field: "phone",
            sourceUrl: "https://avidnyc.com/contact-us",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Contact Us at 718-490-7781 info@avidnyc.com",
          },
        ],
      },
      {
        businessId:
          "source-receipt:7d3b5a36e8199ab69da5fda822ce2d475ea98659b83e783b8bc9ecb947347f07",
        expectedIdentity: {
          name: "Alliance Group",
          city: "Richmond",
          state: "VA",
          website: "https://www.alliancegroupltd.com/",
        },
        patch: {
          website: "https://www.alliancegroupltd.com/",
          phone: "(804) 648-6299",
        },
        fieldModes: {
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.alliancegroupltd.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.alliancegroupltd.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Phone: (804) 648-6299",
          },
        ],
      },
      {
        businessId:
          "source-receipt:7f86f172317656661b6ed0785c6bfac7e84b61eea428d07eb4209387a890a93e",
        expectedIdentity: {
          name: "Sports Center of Richmond (SCOR)",
          city: "Richmond",
          state: "VA",
          website: "https://scor-richmond.com/",
        },
        patch: {
          website: "https://scor-richmond.com/",
          description:
            "The Sports Center of Richmond is a climate controlled sports facility offering leagues, camps, classes, field rentals, and a sports cafe.",
          hours:
            "Business Hours: 9 am to 5 pm. Operating Hours: 9 am to Midnight. Hours subject to change do to scheduled activities.",
          phone: "804-257-7267",
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://scor-richmond.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://scor-richmond.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "The Sports Center of Richmond, Richmond's Premier Sports Campus, is a climate controlled sports facility with a family atmosphere for fun, recreation, exercise and athletic advancement for all ages, needs and abilities.",
          },
          {
            field: "phone",
            sourceUrl: "https://scor-richmond.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Phone: 804-257-SCOR (7267)",
          },
          {
            field: "hours",
            sourceUrl: "https://scor-richmond.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Business Hours: 9 am to 5 pm Operating Hours: 9 am to Midnight Hours subject to change do to scheduled activities.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:80bfa8db0da736621f6e8e9a56428666b8544cbd0c4213ab128fbe82270c0fdb",
        expectedIdentity: {
          name: "American Maintenance 3 Janitorial Services and Supplies Co. Corp.",
          city: "Bronx",
          state: "NY",
          website: "https://www.americanmaint1807.com/",
        },
        patch: {
          website: "https://www.americanmaint1807.com/",
          description:
            "American Maintenance 3 Janitorial Services & Supplies Co. Corp. provides commercial and residential cleaning and janitorial services, including COVID-19 disinfection, strip & wax, porter services, apartment/house cleanings, carpet cleaning, sidewalk cleaning, snow removal, and sales of janitorial supplies.",
          hours:
            "We offer janitorial services 24/7 and can be flexible hours to accommodate your business needs.",
          phone: "718-409-0021",
          tags: [
            "office cleaning",
            "residential cleaning",
            "covid-19 disinfection",
            "strip and wax",
            "porter services",
            "carpet cleaning",
            "sidewalk cleaning",
            "snow removal",
            "janitorial supplies",
            "post construction cleaning",
            "window washing",
          ],
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.americanmaint1807.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://americanmaint1807.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "At American Maintenance 3 Janitorial Services & Supplies Co. Corp., we're committed to providing the highest quality janitorial services to our customers.",
          },
          {
            field: "phone",
            sourceUrl: "https://americanmaint1807.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "CALL US TODAY 718-409-0021",
          },
          {
            field: "hours",
            sourceUrl: "https://americanmaint1807.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "What are your hours of operation? We offer janitorial services 24/7 and can be flexible hours to accommodate your business needs.",
          },
          {
            field: "service_tags",
            sourceUrl: "https://americanmaint1807.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "What We Offer Commercial and residential cleaning Office Cleaning Apartment Cleaning General Office Cleaning Post Construction Cleaning Interior and exterior window washing (up to 6 feet) High Dusting (6 feet and above) Carpet Cleaning Services Strip and waxing of terrazzo and Commercial Vinyl tile floors. Sales of Janitorial Supplies",
          },
        ],
      },
      {
        businessId:
          "source-receipt:873d91265a7f13a02b56ee6c812eccc413d1c30edd984b92bf941fca6925860c",
        expectedIdentity: {
          name: "Astound.Media LLC",
          city: "Bronx",
          state: "NY",
          website: "https://www.astound.media/",
        },
        patch: {
          website: "https://www.astound.media/",
          description:
            "Astound Media is a New York–based digital studio focused on building and supporting WordPress platforms, providing services including WordPress development, design, hosting, maintenance, SEO, marketing automation, and accessibility.",
          phone: "+1 (707) ASTOUND (278-6863)",
          tags: [
            "wordpress development",
            "wordpress design",
            "wordpress hosting",
            "wordpress maintenance",
            "woocommerce development",
            "wordpress seo",
            "local seo",
            "website performance optimization",
            "wordpress security",
            "marketing automation",
            "website accessibility",
            "digital strategy",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.astound.media/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://astound.media/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Astound Media is a New York–based digital studio focused on building and supporting WordPress platforms that perform reliably over time."',
          },
          {
            field: "phone",
            sourceUrl: "https://astound.media/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Phone: +1 (707) ASTOUND (278-6863)"',
          },
          {
            field: "service_tags",
            sourceUrl: "https://astound.media/our-services/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"We provide WordPress development, branding, SEO, marketing automation, and business technology solutions"',
          },
        ],
      },
      {
        businessId:
          "source-receipt:8a415d518eafc9fc38b2eb90544febb8659c848d40bc5c7cde968866c070e8a0",
        expectedIdentity: {
          name: "Chefsity LLC",
          city: "Richmond Hill",
          state: "NY",
          website: "https://www.chefsity.com/",
        },
        patch: {
          website: "https://www.chefsity.com/",
          description:
            "Custom charcuterie boards and private chef services in NYC.",
          tags: ["custom charcuterie boards", "private chef services"],
        },
        fieldModes: {
          description: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.chefsity.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.chefsity.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Chefsity | Custom Charcuterie Boards & Private Chef Services in NYC",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.chefsity.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Chefsity | Custom Charcuterie Boards & Private Chef Services in NYC",
          },
        ],
      },
      {
        businessId:
          "source-receipt:8b0578e2324ec3690aac79361f1afea6f4ecd6c5fc15c6cc4bd19bad310526d1",
        expectedIdentity: {
          name: "JMV Associates, LLC",
          city: "Bayside",
          state: "NY",
          website: "https://www.jmvassociatesllc.com/",
        },
        patch: {
          website: "https://www.jmvassociatesllc.com/",
          hours: "Monday - Friday | 9:00 am - 5:00 pm",
          phone: "(718) 631-0006",
        },
        fieldModes: {
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.jmvassociatesllc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.jmvassociatesllc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "(718) 631-0006",
          },
          {
            field: "hours",
            sourceUrl: "https://www.jmvassociatesllc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Monday - Friday | 9:00 am - 5:00 pm",
          },
        ],
      },
      {
        businessId:
          "source-receipt:8e91860f3d2197cf51575defdeafc6a55d5510a0670c0c5ca39fb86dc6fcf07b",
        expectedIdentity: {
          name: "Celeste Umpierre Architect PLLC",
          city: "Jackson heights",
          state: "NY",
          website: "https://www.cu-a.com/",
        },
        patch: {
          website: "https://www.cu-a.com/",
          description:
            "Architectural practice offering design and studio services.",
          phone: "Office 718 424 2240",
          tags: ["architectural practice", "design", "studio"],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.cu-a.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.cu-a.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "C E L E S T E U M P I E R R E A R C H I T E C T work studio contact",
          },
          {
            field: "phone",
            sourceUrl: "https://www.cu-a.com/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Office 718 424 2240",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.cu-a.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "C E L E S T E U M P I E R R E A R C H I T E C T work studio",
          },
        ],
      },
      {
        businessId:
          "source-receipt:953df12f69afe49934c64fe46d5e3c552f3b9afcc27170774ba38cd66805ece0",
        expectedIdentity: {
          name: "Beyond Yoga Now",
          city: "Bronx",
          state: "NY",
          website: "https://www.beyondyoganow.com/",
        },
        patch: {
          website: "https://www.beyondyoganow.com/",
          description:
            "A wellness studio offering yoga, meditation, group classes, 1:1 sessions, and workshops with a holistic, trauma-informed approach for women, families, and communities.",
          phone: "+1 347-908-0506",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.beyondyoganow.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.beyondyoganow.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "A holistic yoga and mindfulness approach supporting mental, emotional, and physical wellbeing for women, families, and communities experiencing social, economic and family trauma",
          },
          {
            field: "phone",
            sourceUrl: "https://www.beyondyoganow.com/contact-us/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Telephone: +13479080506",
          },
        ],
      },
      {
        businessId:
          "source-receipt:9d63a726c6317b4fa03fb2efd54fe9fe4fb1387b90c8e2fdb410a9f6089250a0",
        expectedIdentity: {
          name: "ANDAMIO SCAFFOLDING LLC",
          city: "Bronx",
          state: "NY",
          website: "https://www.andamioscaffolding.com/",
        },
        patch: {
          website: "https://www.andamioscaffolding.com/",
          description:
            "We Install & Dismantle Our Equipment and do Not Rent or Sell Equipment to Others for Use.",
          phone: "(914) 353-5555",
          tags: [
            "sidewalk bridge",
            "pipe scaffolding",
            "hoist",
            "equipment installation",
            "equipment dismantle",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.andamioscaffolding.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.andamioscaffolding.com/our-services",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"We Install & Dismantle Our Equipment and do Not Rent or Sell Equipment to Others for Use."',
          },
          {
            field: "phone",
            sourceUrl: "https://www.andamioscaffolding.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Contact Us: (914) 353-5555"',
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.andamioscaffolding.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "medium",
            note: '"home | ANDAMIO SCAFFOLDING LLC | Sidewalk Bridge, Pipe Scaffolding, Hoist"',
          },
        ],
      },
      {
        businessId:
          "source-receipt:9ed40f15be5d11bead8ce18916c1abf5c60697c840c17e52e7801b07e1adca4a",
        expectedIdentity: {
          name: "Conemco Engineering, Inc.",
          city: "Jamaica",
          state: "NY",
          website: "https://www.conemco.com/",
        },
        patch: {
          website: "https://www.conemco.com/",
          description:
            "Conemco Consultants is a full-service Engineering and Land Surveying firm with experience in Structural, Civil and MEP Engineering Design, Inspection, Construction Management and Mapping Services.",
          phone: "646-491-6070",
          tags: [
            "structural engineering",
            "civil engineering",
            "mep engineering",
            "structural inspection",
            "civil inspection",
            "construction management",
            "land surveying",
            "mapping",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.conemco.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://conemco.com/about-us/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Conemco Consultants is a full-service Engineering and Land Surveying firm with experience in Structural, Civil and MEP Engineering Design, Inspection, Construction Management and Mapping Services.",
          },
          {
            field: "phone",
            sourceUrl: "https://conemco.com/contact-us/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "NEW YORK 646-491-6070 888-575-6384",
          },
          {
            field: "service_tags",
            sourceUrl: "https://conemco.com/services/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Services Engineering Design Inspections Construction Management Survey and Mapping Structural, Civil, and MEP Engineering Design",
          },
        ],
      },
      {
        businessId:
          "source-receipt:a887f335d7385f0c24d35bfd34deb39ac636d7b3e4bb592c2b23dde02981de99",
        expectedIdentity: {
          name: "Jewett Machine Mfg. Co.",
          city: "Richmond",
          state: "VA",
          website: "https://jewettmachine.com/",
        },
        patch: {
          website: "https://jewettmachine.com/",
          description:
            "CNC machining, grinding, turning, milling, and Swiss screw machine services.",
          phone: "804-233-9873",
          tags: [
            "cnc machining",
            "cnc grinding",
            "cnc milling",
            "cnc turning",
            "swiss screw machine",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://jewettmachine.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://jewettmachine.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Jewett Machine - CNC Machining, Grinding, Turning, Swiss Screw",
          },
          {
            field: "phone",
            sourceUrl: "https://jewettmachine.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Let's Chat 804-233-9873",
          },
          {
            field: "service_tags",
            sourceUrl: "https://jewettmachine.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Jewett Machine - CNC Machining, Grinding, Turning, Swiss Screw",
          },
        ],
      },
      {
        businessId:
          "source-receipt:b094860f52c40860b5b88d5aede3e1b68c90b731ed87bb4fd5346cd9607b30b5",
        expectedIdentity: {
          name: "Alexis Covo LLC",
          city: "Jackson Heights",
          state: "NY",
          website: "https://www.alexcovo.com/",
        },
        patch: {
          website: "https://www.alexcovo.com/",
          description: "Creative studio.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.alexcovo.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://alexcovo.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "medium",
            note: "Alex Covo Studio — Creative evolves. So do we.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:b2dd2d56f4b872a788b61baf9c290ce01bcdd945043e608a6f33a772f0a0c2f8",
        expectedIdentity: {
          name: "Precision Precast Concrete Corp.",
          city: "Arverne",
          state: "NY",
          website: "https://www.precisionprecastconcrete.com/",
        },
        patch: {
          website: "https://www.precisionprecastconcrete.com/",
          description:
            "Precision Precast Concrete manufactures precast concrete products including curtain walls, rainscreens and masonry wall assemblies using FRC, UHPC and SCC.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.precisionprecastconcrete.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://precisionprecastconcrete.com/about/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Precision Precast Concrete manufactures Curtain Walls, Rainscreens and Masonry Wall Assemblies in Fiber Reinforced Concrete (FRC), Ultra High Performance (UHPC) and Self Consolidating Concrete (SCC)."',
          },
        ],
      },
      {
        businessId:
          "source-receipt:b2e2c5aac7d16ca67e723f992528d978c6cf49e8e19c4a6ed8e409d96e314beb",
        expectedIdentity: {
          name: "Buffalo Provisions Distributors, Inc.",
          city: "Elmhurst",
          state: "NY",
          website: "https://www.buffaloprovisions.com/",
        },
        patch: {
          website: "https://www.buffaloprovisions.com/",
          description:
            "We specialize in ethnic and Latin flavored chorizos and sausages with home made recipes under our “El Casero” and “Cocina Familiar” brands.",
          phone: "(718) 292-4300",
          tags: [
            "ethnic sausages",
            "chorizos",
            "food distribution",
            "dominican products",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.buffaloprovisions.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://buffaloprovisions.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "We specialize in ethnic and Latin flavored chorizos and sausages with home made recipes under our “El Casero” and “Cocina Familiar” brands.",
          },
          {
            field: "phone",
            sourceUrl: "https://buffaloprovisions.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "(718) 292-4300 Call Us Now",
          },
          {
            field: "service_tags",
            sourceUrl: "https://buffaloprovisions.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Since then Buffalo Provisions Distributors has been distributing ethnic sausages and an extended line of food.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:b60d01797d9406dffc8a1112329be70ea68245e7d1cddcd4d79039d6ce3efef7",
        expectedIdentity: {
          name: "Airtac LLC",
          city: "Bronx",
          state: "NY",
          website: "https://airtacus.com/",
        },
        patch: {
          website: "https://airtacus.com/",
          phone: "929-254-3359",
        },
        fieldModes: {
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://airtacus.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://airtacus.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Phone 929-254-3359",
          },
        ],
      },
      {
        businessId: "source-receipt:b96117c2663112d98f811f1665ccd60233830b74",
        expectedIdentity: {
          name: "LUHV Food",
          city: "Philadelphia",
          state: "PA",
          website: "https://www.luhvfood.com/",
        },
        patch: {
          website: "https://www.luhvfood.com/",
          description:
            "LUHV FOOD is a vegan restaurant/food business; all of the ingredients and food served are 100% vegan.",
          hours: "Everyday 8am - 6pm",
          phone: "(267) 758-5779",
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.luhvfood.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.luhvfood.com/faq",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Is everything really vegan? Yes! All of the ingredients that we use and all of the food we serve are 100% vegan.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.luhvfood.com/locations",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Phone : (267) 758-5779",
          },
          {
            field: "hours",
            sourceUrl: "https://www.luhvfood.com/locations",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Hours : Everyday 8am - 6pm",
          },
        ],
      },
      {
        businessId:
          "source-receipt:bc448a4bcd38a5fd620ed9fb0361883904deb178fee7421e3c4fc84c1e8f4134",
        expectedIdentity: {
          name: "JMV Architect, PLLC",
          city: "Bayside",
          state: "NY",
          website: "https://www.jmvarchitect.com/",
        },
        patch: {
          website: "https://www.jmvarchitect.com/",
          description:
            "JMV Architect (JMV) is a design award-winning architectural firm specialized in commercial, residential, community facilities and educational building types for the public and private sectors.",
          hours: "Monday-Friday: 9:00 AM - 5:00 PM",
          phone: "(718) 631-0006",
          tags: [
            "architectural design",
            "feasibility studies",
            "space planning",
            "contract documents",
            "construction administration",
            "building codes & zoning analysis",
            "governmental agency approvals",
          ],
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.jmvarchitect.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.jmvarchitect.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"JMV Architect (JMV) is a design award-winning architectural firm specialized in commercial, residential, community facilities and educational building types for the public and private sectors."',
          },
          {
            field: "phone",
            sourceUrl: "https://www.jmvarchitect.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"(718) 631-0006"',
          },
          {
            field: "hours",
            sourceUrl: "https://www.jmvarchitect.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Monday-Friday: 9:00 AM - 5:00 PM"',
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.jmvarchitect.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Our Services Feasibility Studies Architectural Design Space Planning Contract Documents ​ Bidding and Negotiation Construction Administration Building Codes & Zoning Analysis Governmental Agency Approvals"',
          },
        ],
      },
      {
        businessId:
          "source-receipt:bf6df7ff6d9707487a919c5e01865990f05d4ec9dfcc4820036b40655be2f039",
        expectedIdentity: {
          name: "Godwin Medical P.C.",
          city: "Riverdale",
          state: "NY",
          website: "http://www.godwinmedicalpc.com/",
        },
        patch: {
          website: "http://www.godwinmedicalpc.com/",
          description:
            "Primary care practice providing specialized care in Internal Medicine and comprehensive health care for adults.",
          phone: "347-587-4020",
          tags: ["internal medicine", "primary care", "adult health"],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://www.godwinmedicalpc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "http://www.godwinmedicalpc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "We provide specialized care in Internal Medicine offering comprehensive health care for adults.",
          },
          {
            field: "phone",
            sourceUrl: "http://www.godwinmedicalpc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "347-587-4020",
          },
          {
            field: "service_tags",
            sourceUrl: "http://www.godwinmedicalpc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "We provide specialized care in Internal Medicine offering comprehensive health care for adults.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:c4d74092a282d5587a911dff24419a50a5876b79ab71605b1b1de25109575920",
        expectedIdentity: {
          name: "Creative Cleaning INC.",
          city: "Bronx",
          state: "NY",
          website: "https://www.creativecleaninginc.com/",
        },
        patch: {
          website: "https://www.creativecleaninginc.com/",
          description:
            "Premier cleaning and maintenance company providing residential, office & commercial, hospitality, and maintenance services in New York City.",
          hours: "We service properties 24/7 depending on your preference!",
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.creativecleaninginc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://creativecleaninginc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "We are a premier cleaning and maintenance company dedicated to providing exceptional services to homes and businesses throughout New York City.",
          },
          {
            field: "hours",
            sourceUrl: "https://creativecleaninginc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "We service properties 24/7 depending on your preference! Whether you prefer an overnight cleaning or a day-time weekend service, we can make it happen!",
          },
        ],
      },
      {
        businessId: "source-receipt:cb6990ebe90614d01ee9a44523bdb7bfe44cc4fc",
        expectedIdentity: {
          name: "Estilo Dance Studio",
          city: "Philadelphia",
          state: "PA",
          website: "https://estilodancestudio.com/",
        },
        patch: {
          website: "https://estilodancestudio.com/",
          description:
            "Estilo Dance Studio is dedicated to providing professional group instruction, choreography, private lessons, and entertainment, teaching popular Latin dances such as Salsa, Cha Cha, Mambo, and Bachata.",
          phone: "(267) 317-8849",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://estilodancestudio.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://estilodancestudio.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Estilo Dance Studio is dedicated to providing professional group instruction, choreography, private lessons, and entertainment. Whether you are an experienced dancer or have never stepped out on a dance floor, become skilled in the most popular Latin dances such as Salsa, Cha Cha, Mambo,or Bachata.",
          },
          {
            field: "phone",
            sourceUrl: "https://estilodancestudio.com/contact/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Call/Text: (267) 317-8849",
          },
        ],
      },
      {
        businessId:
          "source-receipt:cb9ec744931516a42cea052ead0f1f9d99d45094e5fd76ce891fe64b7fbaceab",
        expectedIdentity: {
          name: "APC Supplies and Services LLC",
          city: "Jamaica",
          state: "NY",
          website: "https://www.apcsuppliers.com/",
        },
        patch: {
          website: "https://www.apcsuppliers.com/",
          description:
            "Established in 2021, APC Supplies and Services is a business-to-business company providing janitorial products, equipment, training, and budget analysis.",
          phone: "347-814-4350",
          tags: [
            "janitorial products",
            "equipment training",
            "budget analysis",
            "eco-friendly products",
          ],
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.apcsuppliers.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.apcsuppliers.com/about",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Established in 2021, we are a business-to-business company providing janitorial products, equipment, training, and budget analysis to keep your space neat, green, and clean from behind the scenes.",',
          },
          {
            field: "phone",
            sourceUrl: "https://www.apcsuppliers.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Phone: 347-814-4350",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.apcsuppliers.com/about",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"we are a business-to-business company providing janitorial products, equipment, training, and budget analysis to keep your space neat, green, and clean from behind the scenes.",',
          },
        ],
      },
      {
        businessId: "source-receipt:cbaee73daed19fbf55106addcd65de951673b37b",
        expectedIdentity: {
          name: "Bean2Bean Coffee Co.",
          city: "Philadelphia",
          state: "PA",
          website: "https://bean2bean.com/",
        },
        patch: {
          website: "https://bean2bean.com/",
          description:
            "Bean2Bean Coffee Co. is a family owned business that roasts and sells coffee and operates a café.",
          phone: "484-949-1115",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://bean2bean.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://bean2bean.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Bean2Bean Coffee Co. is a family owned business.",
          },
          {
            field: "phone",
            sourceUrl: "https://bean2bean.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "OFFICE (Port Richmond) 3450 Salmon St. Philadelphia, PA 19134 484-949-1115",
          },
        ],
      },
      {
        businessId:
          "source-receipt:cde7a1f4f6e6847b52a43c31b4385a53643542652186f680436c2a2f5f0e69e0",
        expectedIdentity: {
          name: "Valjato Engineering, P.C.",
          city: "Briarwood",
          state: "NY",
          website: "http://www.valjato.com/",
        },
        patch: {
          website: "http://www.valjato.com/",
          description:
            "Valjato Engineering, P.C. is a New York City construction-engineering firm specializing in cranes, hoisting systems, temporary structures, structural support, site safety, and permitting.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://www.valjato.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://valjato.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Valjato Engineering, P.C. is a New York City construction-engineering firm specializing in cranes, hoisting systems, temporary structures, structural support, site safety, and permitting."',
          },
        ],
      },
      {
        businessId:
          "source-receipt:d16dc153268d34f583d2c53a6545f4cf3a1c07b30544d382cc92a56e2149fbb8",
        expectedIdentity: {
          name: "Bliss Leadership & Wellness, LLC",
          city: "Bronx",
          state: "NY",
          website: "https://www.blissleadershipwellness.co/",
        },
        patch: {
          website: "https://www.blissleadershipwellness.co/",
          description:
            "Bliss Leadership & Wellness, LLC provides integrative wellness, leadership, and coaching programs including intuitive coaching, wellness coaching, and leadership coaching; programs are offered hybrid (in person and virtually) and include workshops, retreats, and keynote presentations.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.blissleadershipwellness.co/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.blissleadershipwellness.co/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"We offer three coaching pathways designed to support personal growth, well-being, and leadership development. All programming is hybrid and can be offered in person and virtually; typically 50 minute workshops."',
          },
        ],
      },
      {
        businessId:
          "source-receipt:dd1f043a56d65c26fa95d3c0ae14c03999d2830eb5dfa095fa2e98309ba814cb",
        expectedIdentity: {
          name: "Auxilia Facility Solutions, LLC",
          city: "Woodhaven, NY 11421",
          state: "NY",
          website: "https://www.afs.nyc/",
        },
        patch: {
          website: "https://www.afs.nyc/",
          hours: "24/7 (Including Holidays)",
          phone: "929 302 2938",
        },
        fieldModes: {
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.afs.nyc/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://afs.nyc/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "services@afs.nyc 929 302 2938",
          },
          {
            field: "hours",
            sourceUrl: "https://afs.nyc/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Hours 24/7 (Including Holidays)",
          },
        ],
      },
      {
        businessId:
          "source-receipt:de37ab44f1dbb8e790e8145040fb1f91abfde4dbc27e84ee8f9c512ca1c0969b",
        expectedIdentity: {
          name: "Capaz Mental Health Counseling PLLC",
          city: "Jamaica",
          state: "NY",
          website: "https://www.capazcounseling.com/",
        },
        patch: {
          website: "https://www.capazcounseling.com/",
          description:
            "A wellness practice offering virtual psychotherapy, psychedelic therapy, equitable care, and wellness programming.",
          phone: "(347) 450-8539",
        },
        fieldModes: {
          description: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.capazcounseling.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.capazcounseling.com/about",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "A wellness practice built for the whole picture. Virtual therapy is one piece of care—we show up with the rest: wellness programming, professional development, community care, and more.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.capazcounseling.com/contact",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Office : (347) 450-8539",
          },
        ],
      },
      {
        businessId:
          "source-receipt:e7882b809bdf89c9882f85dba662426819455dc77ee1d329eb8b7a74e9166c3d",
        expectedIdentity: {
          name: "Clean Perfect Janitorial LLC",
          city: "Staten Island",
          state: "NY",
          website: "https://www.cleanperfectjanitorial.com/",
        },
        patch: {
          website: "https://www.cleanperfectjanitorial.com/",
          description:
            "Commercial and high end residential cleaning services including daily cleaning services and post construction cleaning.",
          hours: "Monday – Sunday 24/7",
          phone: "(917) 334-5980",
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.cleanperfectjanitorial.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.cleanperfectjanitorial.com/about",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Our cleaning services… We handle all commercial and high end residential cleanings. Clean Perfect Janitorial was established in 2014, focused on helping clients keeping their spaces clean by offering daily cleaning services, post construction cleaning and more.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.cleanperfectjanitorial.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "cleanperfectjanitorial@gmail.com (917) 334-5980",
          },
          {
            field: "hours",
            sourceUrl: "https://www.cleanperfectjanitorial.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Hours Monday – Sunday 24/7",
          },
        ],
      },
      {
        businessId:
          "source-receipt:e8f0f417dc2f5c556a7cdf091a1f8bf0cbc4245129056c9ebdfdda3aeb589c02",
        expectedIdentity: {
          name: "Creative Concepts NYC Inc.",
          city: "ASTORIA",
          state: "NY",
          website: "http://creativeconceptsnyc.com/",
        },
        patch: {
          website: "http://creativeconceptsnyc.com/",
          description:
            "Creative Concepts NYC is a boutique custom catering and event company offering handmade, fresh, and approachable fare and event design services.",
        },
        fieldModes: {
          description: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://creativeconceptsnyc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://creativeconceptsnyc.com/about/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "About Us Creative Concepts NYC is a boutique custom catering and event company. Our fare is handmade, fresh, and approachable.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:ed997e49dc2a244d2e6323472cd0aaf237fe2bbf70d6cc28a30932c0d1a25b2f",
        expectedIdentity: {
          name: "C L Electric Corp.",
          city: "Jackson Heights",
          state: "NY",
          website: "https://www.clelectricny.com/",
        },
        patch: {
          website: "https://www.clelectricny.com/",
          hours: "Available 24/7 including weekends and holidays.",
          phone: "718-570- 2903",
        },
        fieldModes: {
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://www.clelectricny.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "phone",
            sourceUrl: "https://www.clelectricny.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Call us : 718-570- 2903 347-239-5070",
          },
          {
            field: "hours",
            sourceUrl: "https://www.clelectricny.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "We are available 24/7 including weekends and holidays.",
          },
        ],
      },
      {
        businessId:
          "source-receipt:ee46741111cb51ebbf40a185ab2708fcb49c11567b35a04701c2db5eb9b1f058",
        expectedIdentity: {
          name: "CPR Courses International LLC",
          city: "Bronx",
          state: "NY",
          website: "https://cprcourses.org/",
        },
        patch: {
          website: "https://cprcourses.org/",
          description:
            "CPR Courses International LLC is a medical training and workforce development organization offering CPR, AED, First Aid, BLS, ACLS, PALS, and related healthcare training.",
          hours:
            "Mon By Appointment Tue By Appointment Wed By Appointment Thu By Appointment Fri By Appointment Sat 09:00 am – 01:00 pm Sun Closed",
          phone: "1-800-385-4 CPR (4277)",
        },
        fieldModes: {
          description: "fill",
          hours: "fill",
          phone: "fill",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://cprcourses.org/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://cprcourses.org/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"CPR, AED, FIRST AID, BLS, ACLS and PALS TRAINING AND CERTIFICATION"',
          },
          {
            field: "phone",
            sourceUrl: "https://cprcourses.org/about-us",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"OFFICE: 1-800-385-4 CPR (4277 )"',
          },
          {
            field: "hours",
            sourceUrl: "https://cprcourses.org/about-us",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: '"Hours Mon By Appointment Tue By Appointment Wed By Appointment Thu By Appointment Fri By Appointment Sat 09:00 am – 01:00 pm Sun Closed"',
          },
        ],
      },
      {
        businessId:
          "source-receipt:f113488fbdc38597f0ef888204700c56c64bac1331575a35d58f347c29cb1a36",
        expectedIdentity: {
          name: "Collective Culture, LLC",
          city: "Bronx",
          state: "NY",
          website: "http://www.collectiveculturenyc.com/",
        },
        patch: {
          website: "http://www.collectiveculturenyc.com/",
          description:
            "A New York creative studio producing dynamic motion pictures, live broadcasts, podcasts, documentaries, brand reels, event AV and online courses for corporate, commercial and entertainment clients.",
          tags: [
            "broadcasts & livestreaming",
            "event av & staging",
            "documentaries & interviews",
            "podcast production",
            "brand reels & sizzle videos",
            "branding services",
            "drone photography",
            "online education & training",
            "live event coverage",
          ],
        },
        fieldModes: {
          description: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "http://www.collectiveculturenyc.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://www.collectiveculturenyc.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "A New York creative studio producing dynamic motion pictures for brands and people, globally. Since 2018.",
          },
          {
            field: "service_tags",
            sourceUrl: "https://www.collectiveculturenyc.com/services.html",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Broadcasts & Livestreaming Event AV & Staging Documentaries & Interviews Podcast Production Brand Reels & Sizzle Videos Branding Services Drone Photography Online Education & Training Live Event Coverage",
          },
        ],
      },
      {
        businessId:
          "source-receipt:f4f93e1c07675dfda3959ddcd8775ecc1da3e98d64af1a8307c78f0af03c4b81",
        expectedIdentity: {
          name: "Caribbrew",
          city: "Newark",
          state: "NJ",
          website: "https://caribbrew.com/",
        },
        patch: {
          website: "https://caribbrew.com/",
          description:
            "Caribbrew sells Haitian coffee, chocolate, tea, and botanic skinfood and supplies wholesale and retail to coffee shops, restaurants, grocery stores, and subscription boxes.",
          tags: [
            "haitian coffee",
            "chocolate",
            "tea",
            "botanic skinfood",
            "wholesale",
            "retail",
          ],
        },
        fieldModes: {
          description: "fill",
          tags: "append",
          website: "fill",
        },
        receipts: [
          {
            field: "website",
            sourceUrl: "https://caribbrew.com/",
            sourceLabel: "Verified official website",
            observedAt: "2026-10-15",
            confidence: "high",
            note: "Official website retained after public identity verification. A matching active website is retained.",
          },
          {
            field: "description",
            sourceUrl: "https://caribbrew.com/",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Haitian Coffee, Chocolate, Tea, and Skinfood!",
          },
          {
            field: "service_tags",
            sourceUrl: "https://caribbrew.com/pages/about-us",
            sourceLabel: "Official business page",
            observedAt: "2026-10-16",
            confidence: "high",
            note: "Our Services: Wholesale & Retail We suppy to Coffee Shops and Restaurants, Grocery Stores, Subscription Boxes, and more.",
          },
        ],
      },
    ],
    contentFingerprint:
      "fa22a60a525a68b55ebb3debb550d0c0b531c9441038c60ecafe6090a4846e2d",
  };

export const REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT = 62;
