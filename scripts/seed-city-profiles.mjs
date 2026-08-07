/**
 * seed-city-profiles.mjs — Seed Living Legacy profiles for all 9 tour cities
 * Run: node scripts/seed-city-profiles.mjs
 */
import pg from "pg";

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const PROFILES = [
  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "atlanta",
    brief_context:
      "The undisputed capital of the New South and the beating heart of Black American excellence. Atlanta's story is inseparable from the Civil Rights Movement, the HBCU corridor that has shaped generations of leaders, and the entrepreneurial spirit that turned Auburn Avenue into the wealthiest Black street in America.",
    historical_context: `Atlanta's Black history begins not with struggle but with aspiration. When the city was founded as a railroad terminus in the 1840s, free and enslaved Black people were already essential to its growth. After Emancipation, freedmen and women established communities so quickly and so decisively that by 1906, Sweet Auburn — a stretch of Auburn Avenue east of downtown — had become the commercial and cultural spine of Black Atlanta.

Alonzo Herndon, born enslaved in 1858, built Atlanta Life Insurance Company into one of the largest Black-owned businesses in America. His mansion still stands. The Citizens Trust Bank, founded in 1921, gave Black entrepreneurs access to capital when white banks refused. This was not merely a neighborhood — it was an ecosystem of Black wealth, built brick by brick and dollar by dollar in a city that tried at every turn to contain it.

The Civil Rights Movement found its moral center here. Martin Luther King Jr. was born on Auburn Avenue, preached at Ebenezer Baptist Church two blocks from his childhood home, and is buried on the same street. John Lewis was trained in nonviolent resistance in Atlanta and spent his career in Congress representing it. Maynard Jackson became the city's first Black mayor in 1973 and used the power of municipal contracting to build a Black professional class that transformed the city's economy. The Atlanta of today — its film industry, its airport, its convention economy — was built on that foundation.

The HBCU corridor is Atlanta's most enduring gift to the world. Morehouse College, Spelman College, Clark Atlanta University, and Morris Brown College — clustered within walking distance of each other — have produced more Black PhDs, doctors, lawyers, and leaders than any comparable institution in American history. When you walk through the Atlanta University Center, you are walking through the architecture of Black intellectual life.

Today, Atlanta is a city of contradictions: rapid gentrification displacing the families who built it, while Black entrepreneurship flourishes at a scale the rest of the country is still catching up to. The culture — from trap music to Tyler Perry to the global influence of Atlanta's fashion and food — belongs to the community that created it, and that community is what Mapping With Melanin is here to serve.`,
    why_mwm_here:
      "Atlanta is where Black wealth, Black culture, and Black political power converge at a scale unlike anywhere else in America. From the HBCU corridor to the entrepreneurial spirit of Sweet Auburn to the global reach of Atlanta's creative economy, this city is a living demonstration of what Black excellence looks like when it has room to grow. We're here because the community that built Atlanta deserves a platform that honors that legacy while connecting them to the businesses and spaces that carry it forward.",
    key_neighborhoods: ["Sweet Auburn", "West End", "Vine City", "Cascade Heights", "Pittsburgh", "Mechanicsville"],
    key_figures: ["Martin Luther King Jr.", "John Lewis", "Maynard Jackson", "Alonzo Herndon", "C.T. Vivian", "Andrew Young", "Juanita Abernathy", "Herman Russell", "Cicely Tyson", "Hank Aaron"],
    migration_era: "Atlanta drew freed people and Black professionals to its HBCU corridor before the Great Migration.",
    cultural_anchors: ["Morehouse College", "Spelman College", "Clark Atlanta University", "Martin Luther King Jr. National Historic Site", "APEX Museum of African American History", "Auburn Avenue Research Library", "National Center for Civil and Human Rights", "Atlanta Life Insurance Company Building"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "birmingham",
    brief_context:
      "Birmingham was built on iron and steel — and it was Black labor that forged both. The city that became the crucible of the Civil Rights Movement did not choose that role by accident: it was precisely because the injustice was so visible, and the Black community's courage so extraordinary, that the world's eyes turned here in 1963.",
    historical_context: `Birmingham's Black community was created by industry. When the city was founded in 1871 as an industrial boomtown, Black workers were recruited from across the South to work the iron ore mines, limestone quarries, and steel furnaces that built the New South. By the turn of the 20th century, Birmingham had one of the largest concentrations of Black industrial workers in America — a workforce the city depended on but refused to grant basic dignity.

In the face of this contradiction, Black Birmingham built a parallel world. The Fourth Avenue District — stretching along 4th Avenue North in what is now downtown — became the commercial and cultural heart of Black Birmingham. The Carver Theatre presented jazz and blues performances. The Alabama Jazz Hall of Fame commemorates a tradition that produced, among others, Erskine Hawkins, Sun Ra, and the Tuxedo Junction sound that Glenn Miller made famous worldwide. Black churches — particularly 16th Street Baptist Church — were not just houses of worship but meeting halls, organizing centers, and symbols of community permanence.

The Civil Rights Movement came to Birmingham because Fred Shuttlesworth dared it to. Shuttlesworth, the founder of the Alabama Christian Movement for Human Rights, had been fighting Jim Crow in Birmingham since the 1950s — surviving bombings of his home and church, jail, and beatings — before Dr. King and the SCLC joined Project C (for Confrontation) in 1963. The images that came out of that spring — fire hoses and police dogs turned on children in Kelly Ingram Park — shocked the world and broke the back of legal segregation in America. The 16th Street Baptist Church bombing that September, which killed four little girls — Addie Mae Collins, Carole Robertson, Cynthia Wesley, and Carol Denise McNair — did not break the movement; it hardened its resolve.

Birmingham's Black community has carried that history with grace and determination. The Birmingham Civil Rights Institute, opened in 1992 across from Kelly Ingram Park, is one of the finest civil rights museums in the world. The city has produced figures as varied as Condoleezza Rice, Angela Davis, and the legendary Birmingham Black Barons of the Negro Leagues — the team that launched Willie Mays's career. The steelworkers are gone, but the community they built remains, and it is resilient, creative, and deeply proud.`,
    why_mwm_here:
      "Birmingham is where the American promise of freedom was put to its most severe test — and where Black Americans proved that promise could be redeemed. The city that gave the world the Civil Rights Movement deserves a platform that honors its history while celebrating the community members who are building its future. We're here to connect visitors and residents to the businesses, institutions, and cultural spaces that make Black Birmingham worth knowing.",
    key_neighborhoods: ["Ensley", "Collegeville", "Titusville", "Fairfield", "Avondale", "Fourth Avenue District"],
    key_figures: ["Fred Shuttlesworth", "Condoleezza Rice", "Angela Davis", "Satchel Paige", "Oscar Adams Jr.", "Addie Mae Collins", "Erskine Hawkins", "Sun Ra", "Willie Mays (launched career here)", "Arthur Harold Parker"],
    migration_era: "Black workers from the Deep South built Birmingham's iron and steel industry from the 1870s on.",
    cultural_anchors: ["Birmingham Civil Rights Institute", "16th Street Baptist Church", "Kelly Ingram Park", "Alabama Jazz Hall of Fame", "Miles College", "Fourth Avenue Historic District", "Carver Theatre", "Birmingham Black Barons Memorial"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "charlotte",
    brief_context:
      "The Queen City's Black community built its identity with quiet determination — sustaining neighborhoods, institutions, and a spirit of entrepreneurship through decades of rapid growth that turned a Southern town into America's second-largest banking center. Charlotte has always had a Black community willing to claim its rightful place.",
    historical_context: `Charlotte's Black history is inseparable from the Beatties Ford Road corridor — the spine of Black Charlotte from the Reconstruction era through the present. When the city began to grow after the Civil War, Black Charlotteans settled to the west of downtown, building churches, schools, and businesses along this road that stretched from the city's edge into the countryside. Johnson C. Smith University, founded in 1867 as a freedmen's school, became the anchor of Black Charlotte's intellectual life and remains so today.

In 1957, fifteen-year-old Dorothy Counts walked through jeering crowds to become one of the first Black students to integrate Charlotte's schools. The photograph of her that day — dignified and unbroken — circulated around the world. The man who made desegregation a legal reality in Charlotte was Julius Chambers, a civil rights attorney who argued and won the Swann v. Charlotte-Mecklenburg Board of Education case before the Supreme Court in 1971 — the decision that mandated busing as a tool for school integration nationwide. Charlotte became, briefly, a model of what school integration could look like when a community committed to it.

In 1983, Harvey Gantt became the first Black mayor of Charlotte — and one of the first Black mayors of a major Southern city. His election was not just a political milestone; it was a signal that Black Charlotte's patient, persistent political organizing had produced real power. Gantt's tenure laid the groundwork for a more inclusive city, even as the banking industry that was transforming Charlotte's economy created new pressures on Black neighborhoods.

The Harvey B. Gantt Center for African-American Arts + Culture, named in his honor, is one of the finest Black cultural institutions in the South. Charlotte's Black community has also given the world Anthony Hamilton, whose soul and gospel-inflected voice carries the sound of Black North Carolina, and Stephen Curry, who learned to love basketball on Charlotte's courts before becoming perhaps the greatest shooter in NBA history. The community that raised them — church-going, family-centered, quietly ambitious — is the community Mapping With Melanin is here to serve.`,
    why_mwm_here:
      "Charlotte is one of the fastest-growing cities in America, and that growth is rapidly changing the neighborhoods that Black Charlotteans built. We're here because the community deserves a platform that sees its history, celebrates its culture, and helps residents and visitors discover the businesses and spaces that are keeping Black Charlotte vibrant in the face of extraordinary pressure.",
    key_neighborhoods: ["Beatties Ford Road corridor", "Cherry", "Druid Hills", "Grier Heights", "Hidden Valley", "West Boulevard"],
    key_figures: ["Harvey Gantt", "Dorothy Counts", "Julius Chambers", "Anthony Hamilton", "Stephen Curry", "DaBaby", "Alma Adams", "Kelly Price", "Mary McCrorey", "Thaddeus Tate"],
    migration_era: "Charlotte's Black community grew from Reconstruction along the Beatties Ford Road corridor.",
    cultural_anchors: ["Johnson C. Smith University", "Harvey B. Gantt Center for African-American Arts + Culture", "Levine Museum of the New South", "Charlotte Hawkins Brown Museum (nearby)", "Friendship Missionary Baptist Church", "Little Rock AME Zion Church", "Beatties Ford Road historic corridor"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "columbia",
    brief_context:
      "South Carolina's capital is where Reconstruction's promise burned brightest and was most brutally extinguished — and where the Black community rebuilt itself generation after generation, turning two historically Black universities and a tradition of civil rights activism into an enduring foundation of dignity and resistance.",
    historical_context: `Columbia holds a unique place in African American history as the site of one of the most extraordinary experiments in American democracy. During Reconstruction, South Carolina's legislature became majority-Black — the first and, for nearly a century, the only state legislature in the nation where Black Americans held the majority. These men — many of them freedmen who had been enslaved just years before — passed progressive legislation on education, labor rights, and civil rights that was decades ahead of the rest of the country. The Reconstruction constitution they wrote in 1868 established South Carolina's public school system. When Reconstruction was violently overthrown in 1876, much of what they built was destroyed. But not all of it.

Benedict College and Allen University, both founded in the 1870s in Columbia, became the institutional anchor of Black South Carolina. Benedict and Allen have educated generations of teachers, ministers, lawyers, and community leaders — including many who led the Civil Rights Movement not just in South Carolina but nationally. The campus of Allen University, founded by the African Methodist Episcopal Church, is a National Historic Landmark District.

Modjeska Monteith Simkins, born in Columbia in 1899, became the most consequential civil rights leader South Carolina produced in the 20th century. Her home — a modest house on Marion Street — was a strategy center for decades of civil rights organizing. She helped file the Briggs v. Elliott case, one of the five cases that became Brown v. Board of Education. She organized voter registration drives, fought tuberculosis in the Black community as a public health nurse, and spent seventy years demanding that South Carolina live up to its Reconstruction promise. She called herself "the First Lady of Civil Rights in South Carolina." She was not wrong.

The Mann-Simons Cottage, a Columbia landmark, tells the story of Celia Mann — a formerly enslaved woman who purchased her freedom and then purchased land in Columbia in the 1840s, building a home and a business that her family maintained for over a century. It is one of the most remarkable stories of Black self-determination in American history, and it took place in Columbia, South Carolina, before the Civil War ended.`,
    why_mwm_here:
      "Columbia is a city where African American history is layered into every block — from Reconstruction's democratic experiment to Modjeska Simkins's living room to the campuses of Benedict and Allen. We're here because that history deserves to be honored in the present tense, and because Columbia's Black community deserves to be connected to the businesses and institutions that are carrying that legacy forward.",
    key_neighborhoods: ["Waverly", "Edgewood", "Eau Claire", "North Columbia", "Olympia (historic mill community)"],
    key_figures: ["Modjeska Monteith Simkins", "Robert Brown Elliott", "Matthew Perry", "I.S. Leevy", "Celia Mann", "Benjamin Payton", "Amos Webber", "James Solomon Jr.", "Victoria DeLee", "Richard Theodore Greener"],
    migration_era: "Freed people settled near the State House as Black legislators rewrote South Carolina's laws.",
    cultural_anchors: ["Benedict College", "Allen University", "South Carolina African American History Monument (State House grounds)", "Mann-Simons Cottage", "Modjeska Simkins House", "Waverly community (National Register)", "Ridgewood Community Center"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "houston",
    brief_context:
      "H-Town has always done things its own way. This is the city where Juneteenth was born, where DJ Screw reinvented hip-hop by slowing it down, where Beyoncé grew up, and where the Third Ward's community institutions have anchored Black Houston for over 150 years.",
    historical_context: `Houston's Black history begins with a proclamation. On June 19, 1865 — two and a half years after the Emancipation Proclamation — Union soldiers arrived in Galveston, Texas and announced that enslaved people were free. The celebration that broke out became Juneteenth, the holiday that Black Texans have observed for over 150 years and that became a federal holiday in 2021. Texas — and Houston — is where that freedom was first declared.

Freedmen's Town, the Fourth Ward neighborhood settled by formerly enslaved people in the 1860s, is one of the oldest and most historically significant African American communities in the South. The neighborhood built schools, churches, and businesses so quickly that it became a self-sustaining community within a decade of Emancipation. Its brick streets — paved by Black hands in the early 20th century — are among the last such streets in America. Project Row Houses, founded by artist Rick Lowe in 1993, has spent three decades transforming Freedmen's Town into a living cultural institution that blends art, affordable housing, and community development in a way no other organization in America has matched.

The Third Ward is the cultural heart of Black Houston. Texas Southern University, founded in 1947 after Black students were denied access to the University of Texas, became a center of civil rights organizing — its students were among the first in Texas to stage lunch counter sit-ins in 1960. Emancipation Park, established in 1872 when four Black ministers purchased ten acres so the community would have a place to celebrate Juneteenth, is the oldest park in Houston and one of the oldest public spaces purchased by Black Americans in the South.

Houston's cultural contribution to America is immeasurable. Beyoncé Knowles-Carter grew up in the city's southwest suburbs and has never stopped representing it. DJ Screw invented the "chopped and screwed" technique in his Third Ward home studio in the 1990s, transforming how hip-hop sounds. The city produced Scarface, UGK, Megan Thee Stallion, and Travis Scott — a lineage that defines American popular music. And Barbara Jordan, who represented Houston in the U.S. House of Representatives from 1973 to 1979, remains one of the most powerful orators in the history of American democracy.`,
    why_mwm_here:
      "Houston is the most diverse city in America, and nowhere is that diversity more beautifully and complexly expressed than in its Black communities. From Freedmen's Town to the Third Ward to Sunnyside, these are communities with deep roots, extraordinary resilience, and a creative output that has shaped American culture for generations. We're here because Houston's Black community deserves to be found, celebrated, and supported by the people who love this city.",
    key_neighborhoods: ["Third Ward", "Fourth Ward / Freedmen's Town", "Sunnyside", "Midtown", "Riverside Terrace"],
    key_figures: ["Beyoncé Knowles-Carter", "Barbara Jordan", "DJ Screw", "UGK (Bun B & Pimp C)", "Scarface", "Megan Thee Stallion", "Mickey Leland", "Rick Lowe", "Lightnin' Hopkins", "Yolanda Adams"],
    migration_era: "Freedmen's Town, settled in the 1860s, is where Juneteenth was born and first celebrated.",
    cultural_anchors: ["Texas Southern University", "Emancipation Park", "Project Row Houses (Freedmen's Town)", "Buffalo Soldiers National Museum", "Ensemble Theatre", "Third Ward Cultural Center", "Freedmen's Town Historic District"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "new-orleans",
    brief_context:
      "Jazz was born here. So was gumbo, the Mardi Gras Indian tradition, the second line, and some of the most resilient and joyful Black culture in human history. New Orleans does not merely preserve African American culture — it continuously generates it.",
    historical_context: `New Orleans has one of the oldest and most complex African American communities in North America. Unlike most American cities, New Orleans had a significant free Black population — the gens de couleur libres — before the Civil War. These free people of color built an Afro-Creole culture that was unlike anything else in America: they owned property, attended Catholic mass, spoke French, and created a musical and culinary tradition that the world is still absorbing 200 years later.

The Tremé neighborhood, established in the early 19th century, is widely considered the oldest African American neighborhood in the United States. It was in Tremé that jazz was first played publicly, in Congo Square — the open space where enslaved people were permitted to gather on Sundays and where African musical traditions survived long enough to transform into jazz, blues, gospel, and ultimately all of American popular music. When you listen to anything with a backbeat, you are hearing an echo of what happened in Congo Square.

Louis Armstrong was born in the Tremé in 1901, learned to play cornet in the streets of New Orleans, and went on to become arguably the most influential musician in American history. Fats Domino grew up in the Upper Ninth Ward. Mahalia Jackson, the gospel singer whose voice moved the Civil Rights Movement, grew up singing in New Orleans churches. Allen Toussaint produced and wrote music for decades from his New Orleans studio, shaping the sound of American popular music from behind the scenes. The city has never stopped producing genius.

Hurricane Katrina in 2005 was the most devastating blow to New Orleans's Black community since Reconstruction. More than 100,000 Black residents were displaced; entire neighborhoods were destroyed. What the storm could not destroy was the community itself. The second line parades, the Mardi Gras Indian tribes, the jazz funerals, the brass band tradition — all of it returned, carried by the people who rebuilt because New Orleans was home. That resilience is not a metaphor. It is a lived reality, and it deserves honor.`,
    why_mwm_here:
      "New Orleans is a city that has survived catastrophe and come back singing. Its Black community is the keeper of American music, cuisine, and spiritual tradition in ways the world has only begun to understand. We're here because this community deserves a platform that reflects its genius — not just its trials — and connects visitors and locals to the businesses and cultural spaces that are keeping New Orleans alive, joyful, and irreplaceable.",
    key_neighborhoods: ["Tremé", "Seventh Ward", "Central City", "Ninth Ward", "Hollygrove", "New Orleans East"],
    key_figures: ["Louis Armstrong", "Fats Domino", "Mahalia Jackson", "Allen Toussaint", "Trombone Shorty", "Big Freedia", "Ernest 'Dutch' Morial", "Kermit Ruffins", "Lil Wayne", "Irma Thomas"],
    migration_era: "New Orleans had one of the oldest free Black communities in North America, rooted in Congo Square.",
    cultural_anchors: ["New Orleans Jazz Museum", "Backstreet Cultural Museum (Tremé)", "Xavier University of Louisiana", "Dillard University", "Congo Square (Louis Armstrong Park)", "Amistad Research Center", "Southern University at New Orleans", "Tremé neighborhood"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "philadelphia",
    brief_context:
      "The city where American freedom was declared is also the city where Black Americans have been demanding that freedom be made real for longer than any other place in the nation. Philadelphia is home to the oldest African American church, the first free Black community in America, and a political and cultural tradition as deep as the country itself.",
    historical_context: `Philadelphia's Black history predates the United States. As early as the 1680s, enslaved Africans were present in William Penn's colony. After the Revolution, Philadelphia became the destination of choice for free Black Americans — because Pennsylvania had moved toward gradual emancipation, because the city offered wage labor and community, and because the free Black community that had already formed there provided shelter and support. By 1800, Philadelphia had the largest free Black population of any American city.

Richard Allen founded the African Methodist Episcopal Church in Philadelphia in 1794, in direct response to being dragged from the altar of St. George's Methodist Church for praying in the wrong section. Mother Bethel AME Church, still standing at 6th and Lombard in South Philadelphia, is the oldest continuously Black-owned property in the United States and the birthplace of what would become the largest Black denomination in America. When Allen built that church, he built a sanctuary — not just from racism, but for everything the community needed: schools, community meetings, safe houses for freedom seekers on the Underground Railroad.

Octavius Catto, the Philadelphia educator and civil rights activist assassinated in 1871, fought for Black suffrage and integration with a clarity and courage that should have made him a national figure. His statue now stands in front of Philadelphia City Hall. The Philadelphia Tribune, founded in 1884, is the oldest continuously publishing African American newspaper in the United States. John Coltrane lived and recorded in Philadelphia. Marian Anderson, whose concert on the steps of the Lincoln Memorial in 1939 drew 75,000 people after the Daughters of the American Revolution refused to let her sing in Constitution Hall, was a Philadelphia native. The roots go deep.

West Philadelphia, North Philadelphia, and Germantown each carry their own chapters of this story. The Strawberry Mansion neighborhood was once a center of Black professional life. The Nicetown community built institutions that lasted a century. The hip-hop tradition that produced The Roots, Meek Mill, and Eve is rooted in the rowhouse blocks of North and West Philadelphia, where community was built in the spaces between hard circumstances and extraordinary creativity.`,
    why_mwm_here:
      "Philadelphia's Black community is one of the oldest, most politically active, and most culturally generative in America. The city that gave us the Black church, the free Black community, and the Philadelphia sound deserves a platform that celebrates what it has built. We're here to help visitors and residents discover the businesses, neighborhoods, and cultural institutions that make Black Philadelphia irreplaceable — and to make sure the community that built this city can still find its place in it.",
    key_neighborhoods: ["West Philadelphia", "North Philadelphia", "Germantown", "Strawberry Mansion", "Point Breeze", "Cedar Park"],
    key_figures: ["Richard Allen", "Octavius Catto", "Marian Anderson", "John Coltrane", "The Roots / Questlove", "Meek Mill", "Will Smith", "Eve", "Patti LaBelle", "Bayard Rustin"],
    migration_era: "Philadelphia attracted Black migrants from Virginia and the Carolinas in two Great Migration waves.",
    cultural_anchors: ["Mother Bethel AME Church", "African American Museum in Philadelphia", "Cheyney University (oldest HBCU in America)", "Lincoln University", "Temple University", "Philadelphia Tribune", "Octavius Catto statue (City Hall)", "Tindley Temple United Methodist Church"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "richmond",
    brief_context:
      "Richmond was the capital of the Confederacy — and it is also the city that produced Maggie Lena Walker, the first woman of any race to charter a bank in the United States, and Douglas Wilder, the first Black governor elected in American history. That tension between what Richmond was built to be and what its Black community made of it is the story of the city.",
    historical_context: `Richmond's African American history is as old as the city itself. Enslaved Africans were essential to Richmond's economy from its founding — working tobacco fields, iron foundries, and the docks along the James River that made Richmond one of the wealthiest cities in antebellum America. The slave trade was a central institution: Lumpkin's Jail, one of the largest slave-trading complexes in the South, stood in what is now the Shockoe Bottom neighborhood. Tens of thousands of enslaved people passed through Richmond, bought and sold in its markets.

Jackson Ward, established after the Civil War just north of downtown, became known as "the Harlem of the South" and "the Birthplace of Black Business." By the early 20th century, it was one of the most prosperous African American communities in the nation. Maggie Lena Walker — born in Richmond in 1864, the daughter of a formerly enslaved woman — founded the Saint Luke Penny Savings Bank in 1903, becoming the first woman of any race in the United States to charter and serve as president of a bank. Her home in Jackson Ward is now a National Historic Site. The bank she founded, reorganized and merged over the decades, still exists today as Consolidated Bank and Trust — the oldest Black-owned bank in America.

Bill "Bojangles" Robinson, the tap dancer who became one of the most famous entertainers in America in the early 20th century, was born in Richmond in 1878. Arthur Ashe, the tennis champion who became the first Black man to win Wimbledon and the US Open, grew up in Richmond — and in his later years became a global advocate for human rights and AIDS awareness. D'Angelo, whose album Voodoo changed the sound of R&B at the turn of the millennium, is a Richmond native.

In 1990, Douglas Wilder became the first African American elected governor of any state in US history. He did it in Virginia — the former capital of the Confederacy. That fact alone tells you something about what Black Virginians had built over 125 years of patient, determined political organizing. Monument Avenue, the Richmond boulevard once lined with Confederate statues, is now lined with a single monument: Arthur Ashe, holding a tennis racket and a book, looking down the avenue that used to celebrate the men who enslaved his ancestors. Richmond chose that. It matters.`,
    why_mwm_here:
      "Richmond carries the weight of American history in ways few cities can match — and its Black community has responded to that weight with extraordinary achievement. From Maggie Walker's bank to Douglas Wilder's governorship to D'Angelo's music to the removal of Confederate statues, Black Richmond has spent 160 years turning the capital of the Confederacy into something closer to the promise of America. We're here to help people discover the businesses and spaces that carry that legacy forward.",
    key_neighborhoods: ["Jackson Ward", "Church Hill", "Highland Park", "North Side", "Gilpin Court area", "Broad Rock"],
    key_figures: ["Maggie Lena Walker", "Arthur Ashe", "Douglas Wilder", "Bill 'Bojangles' Robinson", "D'Angelo", "Oliver Hill", "Spotswood Rice", "Barbara Johns (led student strike nearby)", "Charles S. Gilpin", "Gus Seyffert"],
    migration_era: "Richmond's freedmen built Jackson Ward into the South's wealthiest Black district after the war.",
    cultural_anchors: ["Maggie L. Walker National Historic Site", "Black History Museum and Cultural Center of Virginia", "Virginia Union University", "Jackson Ward Historic District", "Arthur Ashe Monument (Monument Avenue)", "Lumpkin's Jail archaeological site", "Consolidated Bank and Trust (oldest Black-owned bank in America)", "Valentine Richmond History Center"],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    city_slug: "washington-dc",
    brief_context:
      "Chocolate City has always known its power. From Frederick Douglass's home on Cedar Hill to Howard University's yard to U Street's jazz legacy, Washington DC is where Black America has exercised political and cultural authority for over 150 years — in the shadow of institutions designed to exclude it, and in spite of them.",
    historical_context: `Washington DC became a center of African American life almost from its founding. By the time of the Civil War, the city had the largest free Black population in America, concentrated in neighborhoods like Georgetown, Capitol Hill, and the area that would become the U Street corridor. When Emancipation came in 1863 — a full year before the Emancipation Proclamation applied nationally, because DC was federal territory — Black Washingtonians were already building the institutions that would shape Black America for generations.

Howard University, chartered by Congress in 1867, became the most important institution of higher education for African Americans in the United States. Its law school trained Thurgood Marshall, who argued Brown v. Board of Education before the Supreme Court. Its medical school trained the doctors who served communities that white hospitals refused. Its faculty included W.E.B. Du Bois, Alain Locke, Sterling Allen Brown, and Toni Morrison — a roster of Black intellectual life that has never been equaled. When you walk through Howard's campus, you walk through the archive of Black American thought.

U Street — known as "Black Broadway" from the 1920s through the 1950s — was one of the most vibrant cultural districts in America. Duke Ellington grew up in DC and played his first professional gigs on U Street. Marvin Gaye was born in DC and sang in church choirs before becoming one of the defining voices of American popular music. The Lincoln Theatre, the Howard Theatre, and dozens of clubs and ballrooms presented jazz, blues, and gospel to audiences that included the full spectrum of Black Washington — from professionals to domestic workers — in a city where they could not sit at a lunch counter with white people.

Go-go music — the distinctly DC form of percussion-driven funk invented by Chuck Brown in the 1970s — is one of the great unacknowledged contributions to American music. Brown, known as "the Godfather of Go-Go," played continuous dance music that never stopped between songs, creating a groove that audiences could inhabit for hours. Go-go is still played at venues across DC, and it remains a living tradition — the soundtrack of Black DC's refusal to be culturally erased even as gentrification has transformed the neighborhoods where the music was born.`,
    why_mwm_here:
      "Washington DC is where Black political power in America has its deepest roots, and where the fight for justice has been waged at the highest levels for generations. From the halls of Congress to Howard's Yard to the go-go clubs of Northeast DC, this is a city that refuses to let Black culture be erased. We're here to help the community — navigating a rapidly gentrifying city — find the spaces that still belong to them, and to support the businesses that are carrying DC's Black legacy into the future.",
    key_neighborhoods: ["U Street Corridor", "Shaw", "Congress Heights", "Anacostia", "LeDroit Park", "Deanwood"],
    key_figures: ["Frederick Douglass", "Chuck Brown", "Duke Ellington", "Marvin Gaye", "Thurgood Marshall", "Eleanor Holmes Norton", "John Hope Franklin", "Ida B. Wells (lived in DC)", "Walter E. Washington", "Wale"],
    migration_era: "Black Southerners arrived during the Great Migration and built U Street into Black Broadway.",
    cultural_anchors: ["Howard University", "National Museum of African American History and Culture", "Frederick Douglass National Historic Site", "Ben's Chili Bowl", "Mary McLeod Bethune Council House", "Howard Theatre", "Lincoln Theatre", "Anacostia Community Museum"],
  },
];

async function main() {
  await db.connect();
  console.log("Connected to Railway DB");

  // Verify all slugs exist in city_launches
  const { rows: slugs } = await db.query("SELECT slug FROM city_launches");
  const validSlugs = new Set(slugs.map((r) => r.slug));
  for (const p of PROFILES) {
    if (!validSlugs.has(p.city_slug)) {
      console.warn(`  WARNING: slug "${p.city_slug}" not found in city_launches — skipping`);
    }
  }

  let updated = 0;
  for (const p of PROFILES) {
    if (!validSlugs.has(p.city_slug)) continue;

    // Upsert — create row if it doesn't exist, then update all fields
    await db.query(
      `INSERT INTO city_profiles (city_slug, brief_context, historical_context)
       VALUES ($1, $2, $3)
       ON CONFLICT (city_slug) DO NOTHING`,
      [p.city_slug, p.brief_context, p.historical_context]
    );

    const { rowCount } = await db.query(
      `UPDATE city_profiles SET
         brief_context       = $1,
         historical_context  = $2,
         why_mwm_here        = $3,
         key_neighborhoods   = $4,
         key_figures         = $5,
         migration_era       = $6,
         cultural_anchors    = $7,
         updated_at          = NOW()
       WHERE city_slug = $8`,
      [
        p.brief_context,
        p.historical_context,
        p.why_mwm_here,
        p.key_neighborhoods,
        p.key_figures,
        p.migration_era,
        p.cultural_anchors,
        p.city_slug,
      ]
    );

    console.log(`  ✓ ${p.city_slug} — updated ${rowCount} row(s)`);
    updated++;
  }

  // Verify
  const { rows: verify } = await db.query(
    `SELECT city_slug,
            LENGTH(historical_context) AS ctx_len,
            array_length(key_neighborhoods, 1) AS nbhd_count,
            array_length(key_figures, 1) AS fig_count
     FROM city_profiles
     ORDER BY city_slug`
  );
  console.log("\nVerification:");
  for (const row of verify) {
    console.log(
      `  ${row.city_slug}: ctx=${row.ctx_len ?? 0} chars, ${row.nbhd_count ?? 0} neighborhoods, ${row.fig_count ?? 0} figures`
    );
  }

  console.log(`\nDone — seeded ${updated} city profiles`);
  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
