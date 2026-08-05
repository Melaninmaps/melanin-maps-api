/**
 * Seed city profiles for all 9 registered cities.
 * Extracted from Cultural Guide Parts 1, 2 & 3.
 * Run: npx tsx src/scripts/seed-city-profiles.ts
 *
 * Idempotent — uses ON CONFLICT DO UPDATE so re-running is safe.
 */
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PROFILES = [
  {
    slug: "philadelphia",
    historical_context: `Philadelphia has been a significant center for the Black diaspora since the 17th century. William Still, a freeborn Black Philadelphian, coordinated Underground Railroad escapes from his office on Lombard Street, helping over 800 freedom seekers reach safety. The city's African American community established Mother Bethel AME Church in 1794 — the oldest African American church still standing on its original site — and built institutions that would anchor Black civic life through two centuries of struggle and achievement.

During the Great Migration, Philadelphia's Black population swelled as families from the South sought industrial work and relative freedom, creating thriving neighborhoods in West Philadelphia, North Philadelphia, and Germantown. Today the city honors this legacy through more than 4,500 murals — many celebrating African American heroes — through the African American Museum in Philadelphia, and through communities still fighting for the dignity and opportunity their ancestors were promised.`,
    brief_context: `Philadelphia has been a significant center for the Black diaspora since the 17th century, from the Underground Railroad coordinated by William Still to Mother Bethel AME Church — the oldest African American church on its original site. Over 4,500 murals across the city honor African American heroes and the ongoing story of a community that never stopped building.`,
    why_mwm_here: `Philadelphia is where African American institution-building began in America. The first Black church, the first Black hospital, some of the earliest Black-owned newspapers — all were founded here. MWM is here because the businesses and cultural spaces we're mapping exist within this centuries-deep tradition of Black Philadelphians building for themselves. Every corner restaurant, every beauty supply, every community center is part of that lineage.`,
    key_neighborhoods: ["Germantown", "West Philadelphia", "North Philadelphia", "South Philadelphia", "Strawberry Mansion"],
    key_figures: ["William Still", "Richard Allen", "Octavius Catto", "Marian Anderson", "Patti LaBelle"],
    migration_era: "Great Migration",
    cultural_anchors: ["Underground Railroad", "Mother Bethel AME Church", "4,500+ murals", "African American Museum in Philadelphia", "Philadelphia Mural Arts Program"],
  },
  {
    slug: "atlanta",
    historical_context: `Atlanta's Sweet Auburn district was once called "the richest Negro street in the world" by Forbes magazine — a dense corridor of Black-owned banks, insurance companies, newspapers, and cultural institutions that rivaled any district in America. Auburn Avenue was home to Citizens Trust Bank, the Atlanta Daily World, the Herndon Building, and the birthplace of Martin Luther King Jr. The Atlanta University Center, a consortium of six HBCUs anchored by Morehouse, Spelman, and Clark Atlanta, made the city a capital of Black intellectual life for over a century.

When the Great Migration reshaped American cities, Atlanta's Black professional class built a parallel economy that sustained the community through Jim Crow — and that tradition of Black entrepreneurship continues today in BeltLine corridors, Cascade Heights, and emerging neighborhoods across the city. Atlanta is not just a city that produces Black excellence — it is a city that was built by it.`,
    brief_context: `Atlanta's Sweet Auburn district was once called "the richest Negro street in the world" — a corridor of Black banks, newspapers, and cultural institutions that anchored the city's Black community through a century of Jim Crow. The Atlanta University Center consortium of HBCUs made Atlanta the capital of Black intellectual life in the American South.`,
    why_mwm_here: `Atlanta is the beating heart of Black professional America. From the AUC to the thriving entrepreneur scene in Old Fourth Ward and beyond, there are more Black-owned businesses, Black-led organizations, and Black cultural institutions per square mile than almost anywhere else in the country. MWM is here to map and honor every layer of that ecosystem.`,
    key_neighborhoods: ["Sweet Auburn", "Cascade Heights", "Old Fourth Ward", "Mechanicsville", "Pittsburgh"],
    key_figures: ["Martin Luther King Jr.", "Alonzo Herndon", "W.E.B. Du Bois", "Maynard Jackson", "John Lewis"],
    migration_era: "Post-Civil War",
    cultural_anchors: ["Sweet Auburn", "Atlanta University Center", "The King Center", "Ebenezer Baptist Church", "National Center for Civil and Human Rights"],
  },
  {
    slug: "birmingham",
    historical_context: `Birmingham, Alabama is where the Civil Rights Movement faced its most brutal test — and where ordinary Black citizens showed extraordinary courage in the face of it. The 16th Street Baptist Church bombing in 1963, which killed four little girls, and Bull Connor's fire hoses and police dogs turned a local struggle into a national moral crisis that forced the nation to choose.

But Birmingham's Black community had been building resistance infrastructure for decades before the cameras arrived: fraternal orders, mutual aid societies, labor unions, and the tight-knit neighborhood of Smithfield, which produced more Black professionals per capita than almost anywhere in the South. Birmingham's story is about a people who maintained their humanity and built their institutions in the shadow of one of the most violent centers of American apartheid — and who ultimately won.`,
    brief_context: `Birmingham is where the Civil Rights Movement faced its most violent opposition — and where Black communities showed the courage that changed the nation. From the 16th Street Baptist Church to the fraternal networks of Smithfield, Birmingham's Black residents built institutions of resistance that held through decades of terror and became the foundation for what came after.`,
    why_mwm_here: `Every Black business that opens in Birmingham exists because people died for the right to do business here. MWM is in Birmingham to honor that history by mapping the living businesses, spaces, and communities that are the direct inheritors of everything those freedom fighters built.`,
    key_neighborhoods: ["Smithfield", "Ensley", "Avondale", "Collegeville", "Titusville"],
    key_figures: ["Fred Shuttlesworth", "Angela Davis", "Condoleezza Rice", "Addie Mae Collins", "A.G. Gaston"],
    migration_era: "Great Migration",
    cultural_anchors: ["16th Street Baptist Church", "Birmingham Civil Rights Institute", "Kelly Ingram Park", "A.G. Gaston Motel", "Boutwell Auditorium"],
  },
  {
    slug: "charlotte",
    historical_context: `Charlotte's Black history is inseparable from the story of Brooklyn — Second Ward — an autonomous Black neighborhood that flourished for over a century before being demolished by urban renewal in the 1960s and 70s. Brooklyn was Charlotte's Harlem: it had its own theaters, hotels, newspapers, and professional class, all organized around the community's own needs and rhythms.

Biddle University (now Johnson C. Smith University), founded in 1867 for newly freed people, anchored the intellectual life of the region. The destruction of Brooklyn was not just the clearing of buildings — it was the deliberate erasure of a self-sufficient Black community that city planners treated as an obstacle rather than an asset. Charlotte's Black community has been rebuilding ever since, and the city's rapid growth has created new opportunities even as gentrification once again threatens what was built.`,
    brief_context: `Charlotte's Brooklyn neighborhood — Second Ward — was a self-sufficient Black community that thrived for over a century before urban renewal erased it in the 1960s and 70s. Johnson C. Smith University, founded in 1867, anchored the region's Black intellectual life and continues that tradition today as Charlotte rebuilds what was lost.`,
    why_mwm_here: `Charlotte is one of the fastest-growing cities in America, and that growth is hitting historic Black communities hard. MWM is here to make sure the Black businesses, cultural spaces, and community anchors that survived — and the new ones being built — are seen, supported, and valued before another wave of development erases what was built.`,
    key_neighborhoods: ["Second Ward (Brooklyn)", "Historic West End", "Biddleville", "Cherry", "University City"],
    key_figures: ["Kelly Alexander Sr.", "Harvey Gantt", "J. Charles Jones", "Mary McLeod Bethune"],
    migration_era: "Post-Civil War",
    cultural_anchors: ["Johnson C. Smith University", "Harvey B. Gantt Center for African-American Arts + Culture", "Levine Museum of the New South", "Brooklyn Village Memorial"],
  },
  {
    slug: "columbia",
    historical_context: `Columbia, South Carolina sits at the center of a state where Reconstruction's possibilities — Black legislators, Black landowners, Black institutions — were most fully realized, and most violently destroyed. Allen University and Benedict College, both founded in the 1870s to educate freed people, have anchored Columbia's Black intellectual community for over 150 years and continue producing graduates who lead across South Carolina and the nation.

The Waverly neighborhood was Columbia's historic Black commercial district, home to Black-owned businesses, social clubs, and civic organizations that sustained the community through decades of legal segregation. Columbia's story is one of extraordinary endurance — a Black community that kept building through Reconstruction's betrayal, Jim Crow's brutality, and urban renewal's erasure, and continues building today.`,
    brief_context: `Columbia is home to Allen University and Benedict College — two HBCUs founded in the 1870s that have anchored the city's Black intellectual community for over 150 years. The Waverly neighborhood served as Columbia's historic Black commercial district, sustaining the community through Reconstruction, Jim Crow, and beyond.`,
    why_mwm_here: `South Carolina is where Reconstruction came closest to its promise — and where its destruction was most complete. MWM is in Columbia to map the businesses, institutions, and community spaces that are the living heirs to everything Reconstruction built, and a witness to everything that survived.`,
    key_neighborhoods: ["Waverly", "Booker T. Washington Heights", "Eau Claire", "North Columbia"],
    key_figures: ["Modjeska Simkins", "Richard T. Greener", "Septima Poinsette Clark", "James Brown"],
    migration_era: "Post-Civil War",
    cultural_anchors: ["Allen University", "Benedict College", "Waverly Historic District", "Mann-Simons Site", "South Carolina State Museum"],
  },
  {
    slug: "houston",
    historical_context: `Houston's Fourth Ward — historically known as Freedmen's Town — was established by formerly enslaved people in 1866 as one of the first free Black settlements in Texas. Built on the swampy lowlands that white Houstonians didn't want, Fourth Ward's residents paved their own streets with bricks the community made themselves, built their own churches, schools, and businesses, and created a city within a city.

Antioch Missionary Baptist Church, founded by freed people in 1866, still stands as the oldest continuously operating African American church in Houston. The Third Ward anchored the city's Black middle class and HBCU tradition through Texas Southern University, while Sunnyside and Fifth Ward developed their own distinct community identities. Houston's Black community built not just for survival but for dignity, permanence, and pride.`,
    brief_context: `Houston's Freedmen's Town — Fourth Ward — was founded by formerly enslaved people in 1866 who built their own streets, churches, and institutions on land nobody else wanted. The community's handmade brick streets still exist beneath modern pavement — a literal foundation of Black self-determination in one of America's largest cities.`,
    why_mwm_here: `Houston is one of the most diverse cities in America, with Black communities that span Caribbean, African, and American Southern traditions. MWM is here to map the full breadth of that ecosystem — from the historic Fourth Ward to the Third Ward's HBCU corridor to the growing Afro-Caribbean communities across the metro.`,
    key_neighborhoods: ["Freedmen's Town (Fourth Ward)", "Third Ward", "Fifth Ward", "Sunnyside", "Missouri City"],
    key_figures: ["Barbara Jordan", "Jack Yates", "Henrietta Wood", "Mickey Leland", "Beyoncé Knowles-Carter"],
    migration_era: "Post-Civil War",
    cultural_anchors: ["Freedmen's Town Historic District", "Antioch Missionary Baptist Church", "Texas Southern University", "Project Row Houses", "Museum of African American Culture"],
  },
  {
    slug: "new-orleans",
    historical_context: `New Orleans has the most complex and distinctive African American cultural heritage of any American city — the product of French colonial law that recognized a class of free people of color centuries before most of the country acknowledged Black humanity at all. The city's Creole culture, developed by the descendants of African, French, and Spanish intermarriage, produced a unique tradition of art, music, cuisine, architecture, and social organization that shaped American culture globally.

Congo Square, where enslaved people were permitted to gather on Sundays, is the birthplace of jazz — the most influential American art form in the world. The Tremé neighborhood is the oldest Black neighborhood in America, predating the Civil War, and produced a tradition of brass band music and second-line culture that continues today. New Orleans' Black culture is not a footnote to American history — it is American culture.`,
    brief_context: `New Orleans has the most distinctive African American cultural heritage in America — from the free people of color community that flourished under French and Spanish law, to Congo Square where jazz was born, to the Tremé, the oldest Black neighborhood in America. New Orleans' Black culture didn't influence American culture — it created it.`,
    why_mwm_here: `New Orleans is where we prove that MWM is as much about culture as commerce. The Black-owned restaurants, music venues, second-line social aid and pleasure clubs, and Mardi Gras Indian communities in this city are not just businesses — they are living archives of an irreplaceable cultural tradition. MWM is here to make them findable, visible, and celebrated.`,
    key_neighborhoods: ["Tremé", "7th Ward", "9th Ward", "Central City", "Gentilly"],
    key_figures: ["Louis Armstrong", "Mahalia Jackson", "Marie Laveau", "Homer Plessy", "Allen Toussaint"],
    migration_era: "Pre-Civil War",
    cultural_anchors: ["Congo Square", "Tremé neighborhood", "New Orleans Jazz National Historical Park", "Backstreet Cultural Museum", "Dooky Chase's Restaurant"],
  },
  {
    slug: "richmond",
    historical_context: `Richmond, Virginia occupies a singular place in African American history as both the former capital of the Confederacy and the home of Jackson Ward — once called "the Black Wall Street of the East" and "the Harlem of the South." In the late 19th and early 20th centuries, Jackson Ward contained the highest concentration of Black-owned businesses in the United States, anchored by Maggie L. Walker's St. Luke Penny Savings Bank — the first bank chartered by a Black woman in American history.

Richmond is also where Gabriel Prosser organized one of the largest planned slave rebellions in American history in 1800, and where Reconstruction's promises were most dramatically enacted and then most deliberately dismantled. The city's Black community built their own economy literally in the shadow of Confederate monuments — a fact of extraordinary resilience that the removal of those monuments has only partially acknowledged.`,
    brief_context: `Richmond's Jackson Ward was called "the Black Wall Street of the East" — home to Maggie L. Walker's bank, the first chartered by a Black woman in America, and more Black-owned businesses per block than almost anywhere in the country. The community built this extraordinary economy in the literal shadow of Confederate monuments, a testament to resilience that the removal of those monuments has only partially acknowledged.`,
    why_mwm_here: `Richmond is a city of monuments — some to oppression, some to resistance. MWM is here to map the living monuments: the Black-owned businesses, cultural spaces, and community institutions that are the real inheritance of Jackson Ward's tradition. Maggie Walker built a bank. We're building the map that finds everything built since.`,
    key_neighborhoods: ["Jackson Ward", "Church Hill", "Highland Park", "Carver", "Gilpin Court"],
    key_figures: ["Maggie L. Walker", "Gabriel Prosser", "Oliver Hill", "Arthur Ashe", "L. Douglas Wilder"],
    migration_era: "Post-Civil War",
    cultural_anchors: ["Jackson Ward National Historic Landmark", "Maggie L. Walker National Historic Site", "Black History Museum & Cultural Center of Virginia", "Elegba Folklore Society"],
  },
  {
    slug: "washington-dc",
    historical_context: `Washington DC has been a center of African American political and intellectual life since the Civil War era, when thousands of freed people arrived seeking protection, opportunity, and proximity to the government that had promised them citizenship. Howard University, founded in 1867, became the apex of Black intellectual achievement — producing generations of lawyers, doctors, architects, and leaders who shaped American public life for over 150 years.

The U Street corridor, known as "Black Broadway," was home to Duke Ellington, Pearl Bailey, and Langston Hughes's favorite venues, representing some of the most sophisticated Black nightlife and culture in the world. DC is where Thurgood Marshall practiced law, where Mary McLeod Bethune organized political power, and where the tradition of Black civic leadership has been fought for — and sometimes won — in direct confrontation with the institutions of American government.`,
    brief_context: `Washington DC's U Street corridor — "Black Broadway" — was home to Duke Ellington and the most sophisticated Black cultural life in America, while Howard University produced generations of lawyers, doctors, and leaders. DC is where Black people have fought most publicly and most persistently to be included in the power that surrounds them.`,
    why_mwm_here: `Washington DC is the political capital of America and the cultural capital of Black professional achievement. From Anacostia to Petworth to H Street, the city's Black-owned businesses and cultural spaces exist within the tradition of a community that has always had to be twice as good and twice as organized to survive proximity to American power. MWM maps that community with the respect it deserves.`,
    key_neighborhoods: ["U Street / Shaw", "Anacostia", "Petworth", "H Street NE", "Columbia Heights"],
    key_figures: ["Duke Ellington", "Frederick Douglass", "Mary McLeod Bethune", "Thurgood Marshall", "Howard University founders"],
    migration_era: "Civil War era",
    cultural_anchors: ["Howard University", "U Street / Black Broadway", "Frederick Douglass National Historic Site", "National Museum of African American History and Culture", "Ben's Chili Bowl"],
  },
];

async function seed() {
  console.log(`Seeding ${PROFILES.length} city profiles…`);
  let inserted = 0;
  let updated = 0;

  for (const p of PROFILES) {
    const result = await pool.query(
      `INSERT INTO city_profiles
         (city_slug, historical_context, brief_context, why_mwm_here,
          key_neighborhoods, key_figures, migration_era, cultural_anchors)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (city_slug) DO UPDATE SET
         historical_context = EXCLUDED.historical_context,
         brief_context      = EXCLUDED.brief_context,
         why_mwm_here       = EXCLUDED.why_mwm_here,
         key_neighborhoods  = EXCLUDED.key_neighborhoods,
         key_figures        = EXCLUDED.key_figures,
         migration_era      = EXCLUDED.migration_era,
         cultural_anchors   = EXCLUDED.cultural_anchors,
         updated_at         = NOW()`,
      [
        p.slug,
        p.historical_context.trim(),
        p.brief_context.trim(),
        p.why_mwm_here.trim(),
        p.key_neighborhoods,
        p.key_figures,
        p.migration_era,
        p.cultural_anchors,
      ]
    );

    if (result.rowCount === 1) {
      console.log(`  ✓ ${p.slug} — inserted`);
      inserted++;
    } else {
      console.log(`  ↺ ${p.slug} — updated`);
      updated++;
    }
  }

  console.log(`\nDone — ${inserted} inserted, ${updated} updated`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  pool.end();
  process.exit(1);
});
