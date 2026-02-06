이미지 생성 AI(예: Midjourney, Stable Diffusion, DALL-E 3 등)를 사용하여 사용자가 업로드한 사진을 웨딩사진으로 변환하기 위한 프롬프트입니다.

**핵심은 "얼굴 유지(Face Preservation)"입니다.** AI에게 입력된 이미지의 얼굴 특징을 그대로 가져오라고 강력하게 지시해야 합니다.

대부분의 이미지 투 이미지(Image-to-Image) AI 툴은 입력 이미지를 `image_0.png` 또는 이와 유사한 참조 변수로 인식합니다. 아래 프롬프트들은 이 방식을 가정하고 작성되었습니다. (사용하는 플랫폼에 따라 참조 방식이 다를 수 있으니 확인이 필요합니다.)

---

### 🌟 프롬프트 사용 전 필수 공통 지침 (중요)

모든 프롬프트의 가장 앞부분에는 **반드시** 입력 이미지를 참조하고 얼굴을 유지하라는 명령이 들어가야 합니다.

**[공통 전제 프롬프트]**

* **영문:** Based on image_0.png, keep the facial features of the person(s) exactly unchanged.
* **한글:** image_0.png를 바탕으로, 인물의 얼굴 특징을 정확히 그대로 유지하세요.

---

### 10가지 웨딩 컨셉 프롬프트 (한글/영문)

아래의 각 컨셉별 프롬프트를 위의 [공통 전제 프롬프트] 뒤에 붙여서 사용하시면 됩니다.

#### 1. 클래식 & 우아한 스튜디오 (Classic & Elegant Studio)

가장 정석적인 스튜디오 웨딩 화보 스타일입니다. 깔끔하고 고급스러운 분위기를 연출합니다.

* **EN:** Transform the scene into a classic, elegant studio wedding portrait. The couple is posing formally. The bride wears a sophisticated white lace gown with a long veil, and the groom wears a tailored black tuxedo with a bow tie. The background is a clean, minimalist interior with soft, professional studio lighting and subtle cream-colored floral arrangements.
* **KR:** 클래식하고 우아한 스튜디오 웨딩 포트릿으로 장면을 전환하세요. 커플은 정식 포즈를 취하고 있습니다. 신부는 긴 베일이 달린 세련된 화이트 레이스 드레스를, 신랑은 나비넥타이를 맨 잘 재단된 블랙 턱시도를 입고 있습니다. 배경은 깔끔하고 미니멀한 인테리어이며, 부드러운 전문 스튜디오 조명과 은은한 크림색 꽃 장식이 있습니다.

#### 2. 싱그러운 야외 가든 (Lush Outdoor Garden)

자연광 아래 푸릇푸릇한 정원에서 찍은 자연스러운 느낌의 사진입니다.

* **EN:** A romantic outdoor wedding photo in a lush, blooming garden. The couple is smiling candidly, holding hands. The bride wears a flowing bohemian-style wedding dress with floral details, and the groom wears a light beige linen suit. Sunlight filters through the green leaves, creating a soft, dreamy atmosphere with many flowers in the background.
* **KR:** 무성하게 꽃이 핀 정원에서의 로맨틱한 야외 웨딩 사진입니다. 커플은 손을 잡고 자연스럽게 미소 짓고 있습니다. 신부는 꽃 디테일이 있는 하늘거리는 보헤미안 스타일의 웨딩드레스를, 신랑은 밝은 베이지색 린넨 수트를 입고 있습니다. 햇살이 푸른 잎사귀 사이로 스며들어 부드럽고 꿈같은 분위기를 연출하며 배경에는 많은 꽃들이 있습니다.

#### 3. 황홀한 해변의 일몰 (Sunset Beach Destination)

이국적인 해변에서 석양을 배경으로 찍은 드라마틱한 사진입니다.

* **EN:** A dramatic wedding photo on a tropical beach during golden hour sunset. The couple is embracing by the ocean. The bride wears a simple, elegant beach wedding gown, and the groom is in a relaxed white shirt and khaki trousers. The sky is filled with vibrant orange, pink, and purple hues reflecting on the water.
* **KR:** 황금 시간대의 일몰이 지는 열대 해변에서의 드라마틱한 웨딩 사진입니다. 커플은 바닷가 옆에서 포옹하고 있습니다. 신부는 심플하고 우아한 비치 웨딩 가운을, 신랑은 편안한 흰색 셔츠와 카키색 바지를 입고 있습니다. 하늘은 물에 반사되는 선명한 주황색, 분홍색, 보라색 색조로 가득 차 있습니다.

#### 4. 한국 전통의 미, 한복 (Traditional Korean Hanbok)

고궁이나 한옥을 배경으로 한 전통 혼례복 사진입니다.

* **EN:** A traditional Korean wedding portrait set in an ancient palace courtyard. The couple wears elaborate, colorful traditional Korean wedding Hanbok with intricate embroidery. They are standing respectfully. The background features historical Korean architecture with vibrant Dancheong colors and a stone wall under clear daylight.
* **KR:** 고궁 마당을 배경으로 한 전통 한국 웨딩 포트릿입니다. 커플은 복잡한 자수가 놓인 화려하고 다채로운 전통 혼례복(한복)을 입고 정중하게 서 있습니다. 배경은 선명한 단청 색상의 역사적인 한국 건축물과 돌담이 있으며 맑은 낮 시간대입니다.

#### 5. 빈티지 영화 같은 분위기 (Vintage Cinematic Retro)

필름 카메라로 찍은 듯한, 옛날 영화의 한 장면 같은 감성적인 스타일입니다.

* **EN:** A vintage, cinematic wedding photograph with a retro film grain look. The style is 1950s or 60s. The bride wears a vintage tea-length dress and a birdcage veil, the groom wears a retro wool suit. The colors are slightly muted and warm. They are posing in front of an old, classic car on a cobblestone street.
* **KR:** 레트로 필름 그레인 느낌이 나는 빈티지하고 영화 같은 웨딩 사진입니다. 1950년대 또는 60년대 스타일입니다. 신부는 빈티지한 티 렝스(종아리 길이) 드레스와 버드케이지 베일을, 신랑은 레트로 울 수트를 입고 있습니다. 색감은 약간 바래고 따뜻합니다. 그들은 자갈길 위에 있는 오래된 클래식 자동차 앞에서 포즈를 취하고 있습니다.

#### 6. 화려하고 럭셔리한 호텔 (Glamorous & Luxurious Hotel)

샹들리에가 있는 화려한 호텔 연회장이나 로비에서의 웅장한 사진입니다.

* **EN:** A glamorous and luxurious wedding photo inside a grand hotel ballroom. The bride is in a voluminous ball gown with sparkling details and a tiara, the groom in a sharp tuxedo. They are on a grand staircase. The background is opulent, featuring large crystal chandeliers, marble columns, and rich architectural details with dramatic, warm lighting.
* **KR:** 웅장한 호텔 볼룸 내부의 화려하고 럭셔리한 웨딩 사진입니다. 신부는 반짝이는 디테일과 티아라가 있는 볼륨감 넘치는 볼 가운을, 신랑은 멋진 턱시도를 입고 있습니다. 그들은 거대한 계단 위에 있습니다. 배경은 호화로우며, 대형 크리스탈 샹들리에, 대리석 기둥, 그리고 풍부한 건축적 디테일이 드라마틱하고 따뜻한 조명을 받고 있습니다.

#### 7. 자연스러운 도시 스냅 (Candid City Lifestyle)

도심 속에서 데이트하듯 자연스럽게 찍은 스냅샷 느낌입니다.

* **EN:** A candid, lifestyle wedding snapshot in a bustling city street scene (e.g., New York or Paris). The couple is laughing and walking across a crosswalk, holding hands. They are wearing modern, chic wedding attire. The background shows city architecture, blurred pedestrians, and yellow taxi cabs. The vibe is energetic and joyful.
* **KR:** 분주한 도시 거리(예: 뉴욕 또는 파리)에서의 자연스러운 라이프스타일 웨딩 스냅샷입니다. 커플은 웃으며 손을 잡고 횡단보도를 건너고 있습니다. 그들은 현대적이고 시크한 웨딩 복장을 하고 있습니다. 배경은 도시 건축물, 흐릿한 보행자, 노란색 택시를 보여줍니다. 활기차고 즐거운 분위기입니다.

#### 8. 신비로운 숲속의 동화 (Fairytale Enchanted Forest)

안개가 살짝 낀 숲속에서 요정같이 찍은 몽환적인 사진입니다.

* **EN:** A fairytale wedding photo set in a magical, enchanted forest. The lighting is misty and soft with dappled sunbeams. The bride wears an ethereal, flowing tulle dress with vine and flower motifs, maybe a floral crown. The background is moss-covered trees and soft glowing lights, creating a dreamlike quality.
* **KR:** 마법 같은 신비로운 숲을 배경으로 한 동화 같은 웨딩 사진입니다. 조명은 안개가 자욱하고 부드러우며 햇살이 얼룩덜룩 비춥니다. 신부는 덩굴과 꽃 모티브가 있는 영롱하고 하늘거리는 튤 드레스를 입고 있으며 화관을 썼을 수도 있습니다. 배경은 이끼 덮인 나무와 부드럽게 빛나는 조명으로 몽환적인 분위기를 연출합니다.

#### 9. 흑백의 클래식 포트릿 (Timeless Black & White Portrait)

시대를 초월하는 감동을 주는 깊이 있는 흑백 사진입니다.

* **EN:** A timeless black and white wedding portrait. The focus is entirely on the couple's emotion and connection. It's a close-up or medium shot. The lighting is dramatic and high-contrast, highlighting textures of the wedding dress and suit. The background is simple and dark to keep the attention on the subjects.
* **KR:** 시대를 초월한 흑백 웨딩 포트릿입니다. 초점은 전적으로 커플의 감정과 유대감에 맞춰져 있습니다. 클로즈업 또는 미디엄 샷입니다. 조명은 드라마틱하고 대비가 높아 웨딩드레스와 수트의 질감을 강조합니다. 배경은 인물에게 시선이 집중되도록 단순하고 어둡습니다.

#### 10. 미니멀리즘 갤러리 스타일 (Minimalist Gallery Style)

배경을 극도로 단순화하여 인물 자체를 예술 작품처럼 보이게 하는 스타일입니다.

* **EN:** A minimalist, modern wedding photo suitable for an art gallery. The couple is posing artistically against a completely plain, seamless bright white studio wall. No props. The bride wears a very modern, structured architectural wedding dress, and the groom wears a sleek, contemporary monochrome suit. The lighting is clean and even.
* **KR:** 아트 갤러리에 어울리는 미니멀하고 현대적인 웨딩 사진입니다. 커플은 완전히 평평하고 이음새 없는 밝은 흰색 스튜디오 벽을 배경으로 예술적인 포즈를 취하고 있습니다. 소품은 없습니다. 신부는 매우 현대적이고 구조적인 건축적 디자인의 웨딩드레스를, 신랑은 매끄러운 현대적인 모노크롬 수트를 입고 있습니다. 조명은 깨끗하고 균일합니다.