let animeList = [];
const API_KEY = "xai-adLC3Hr8EWOHOj1mXlP8xXBGVOevfxYzrcO1k0zVAuTaOox6zkvT5CS7TUQV2iu0oYIflWGfBmAoOhKA";
const url = "https://api.x.ai/v1/chat/completions";
let originalContent = "";

// 1️⃣ Tải dữ liệu từ JSON
fetch("anime_database.json")
    .then(response => response.json())
    .then(data => {
        animeList = data;
        console.log("Dữ liệu anime đã tải:", animeList);
    })
    .catch(error => console.error("Lỗi khi tải JSON:", error));

// 2️⃣ Khi trang tải xong
document.addEventListener("DOMContentLoaded", function () {
    const input = document.querySelector('.search-text');
    const searchButton = document.querySelector('.search-bt');
    const resultsContainer = document.querySelector('.anime');

    if (!input || !searchButton) {
        console.error("Không tìm thấy input hoặc button!");
        return;
    }

    // Khi nhấn nút tìm kiếm
    searchButton.addEventListener("click", function () {
        const query = input.value.trim().toLowerCase();
        if (query.length > 0) {
            const results = searchAnime(query);
            displayResults(results);
        } else {
            resultsContainer.innerHTML = "<p>Hãy nhập từ khóa để tìm kiếm!</p>";
        }
    });
});

// 3️⃣ Hàm tìm kiếm anime
function searchAnime(query) {
    return animeList.filter(anime => {
        const titleMatch = Object.values(anime.title).some(title =>
            title && title.toLowerCase().includes(query)
        );
        const genreMatch = anime.genres.some(genre =>
            genre.toLowerCase().includes(query)
        );
        const studioMatch = anime.studios.some(studio =>
            studio.toLowerCase().includes(query)
        );
        const yearMatch = String(anime.year).includes(query);
        return titleMatch || genreMatch;
    });
}

// 4️⃣ Hiển thị danh sách kết quả
function displayResults(results) {
    const resultsContainer = document.querySelector('.anime');

    if (results.length === 0) {
        resultsContainer.innerHTML = "<p>Không tìm thấy kết quả phù hợp!</p>";
        return;
    }

    resultsContainer.innerHTML = results.map(anime => `
                <div class="card">
                    <h3>${anime.title.english || anime.title.romaji}</h3>
                    <p><strong>Năm:</strong> ${anime.year}</p>
                    <p><strong>Thể loại:</strong> ${anime.genres.join(", ")}</p>
                    <p><strong>Hãng:</strong> ${anime.studios.join(", ")}</p>
                    <button id="${anime.id}" class="detail-btn">Tìm hiểu thêm</button>
                </div>
            `).join("");

    // Gắn sự kiện cho các nút "Tìm hiểu thêm"
    document.querySelectorAll('.detail-btn').forEach(button => {
        button.addEventListener('click', function () {
            const animeId = this.id;
            showDetails(animeId);
        });
    });
}

// 5️⃣ Hiển thị chi tiết anime với Grok 2
// 5️⃣ Hiển thị chi tiết anime với Gemini API
function showDetails(animeId) {
    const resultsContainer = document.querySelector('.anime');
    const anime = animeList.find(a => a.id === animeId);

    originalContent = resultsContainer.innerHTML;
    resultsContainer.innerHTML = '<p class="loading">đang tải nội dung phim từ gemini...</p>';

    const API_KEYS = [
        "YOUR_API_KEY_1", // Thay bằng key thực tế của bạn
        "YOUR_API_KEY_2",
        "YOUR_API_KEY_3"
    ];
    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    // Prompt yêu cầu nội dung HTML thuần túy
    const prompt = `
    Hãy cung cấp thông tin chi tiết về anime "Bleach: Thousand-Year Blood War - The Conflict" phát hành năm 2024 dưới dạng HTML với cấu trúc sau. Đảm bảo nội dung rõ ràng, đẹp mắt và không bao gồm các thẻ như \`\`\`html hay \`\`\`. Chỉ trả về nội dung HTML thuần túy.

    <h3>tóm tắt</h3>
    <p>[Viết 3-5 câu tóm tắt chi tiết cốt truyện chính.]</p>

    <h3>nhân vật chính</h3>
    <ul>
        <li>[Tên nhân vật 1]: [Mô tả ngắn về vai trò và đặc điểm]</li>
        <li>[Tên nhân vật 2]: [Mô tả ngắn về vai trò và đặc điểm]</li>
        <li>[Tên nhân vật 3]: [Mô tả ngắn về vai trò và đặc điểm]</li>
    </ul>

    <h3>bối cảnh</h3>
    <p>[Mô tả chi tiết về địa điểm, thời gian, và thế giới của anime.]</p>

    <h3>điểm nổi bật</h3>
    <p>[2-3 câu về các sự kiện, chủ đề, hoặc yếu tố đặc biệt làm anime nổi bật.]</p>

    <h3>phong cách</h3>
    <p>[Mô tả ngắn về phong cách nghệ thuật, kỹ thuật hoạt hình, hoặc cách kể chuyện đặc trưng.]</p>
    `;

    function tryFetchWithKeys(keys, index = 0) {
        if (index >= keys.length) {
            throw new Error("hết tất cả api key khả dụng");
        }

        const currentKey = keys[index];
        const urlWithKey = `${GEMINI_URL}?key=${currentKey}`;

        return fetch(urlWithKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 429) {
                        console.log(`API key ${currentKey} hết lượt truy cập, chuyển sang key tiếp theo...`);
                        return tryFetchWithKeys(keys, index + 1);
                    }
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                if (error.message.includes("hết tất cả api key")) throw error;
                return tryFetchWithKeys(keys, index + 1);
            });
    }

    tryFetchWithKeys(API_KEYS)
        .then(data => {
            let plot = "<p>nội dung phim không có sẵn.</p>";
            if (data && data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                plot = data.candidates[0].content.parts[0].text;
            }

            // Loại bỏ các thẻ ```html``` và ``` nếu có
            plot = plot.replace(/```html|```/g, '').trim();

            // Hiển thị nội dung
            resultsContainer.innerHTML = `
                <div class="card-detail">
                    <h2>Bleach: Thousand-Year Blood War - The Conflict</h2>
                    <p><strong>năm:</strong> 2024</p>
                    <p><strong>thể loại:</strong> Action, Adventure, Supernatural</p>
                    <p><strong>hãng:</strong> Pierrot Films, PIERROT FILMS, Shueisha, TV Tokyo, Dentsu, Studio Pierrot</p>
                    <div class="plot-section">${plot}</div>
                    <button id="back-btn">quay lại</button>
                </div>
            `;

            document.getElementById('back-btn').addEventListener('click', function () {
                resultsContainer.innerHTML = originalContent;
                document.querySelectorAll('.detail-btn').forEach(button => {
                    button.addEventListener('click', function () {
                        showDetails(this.id);
                    });
                });
            });
        })
        .catch(error => {
            resultsContainer.innerHTML = `<p>lỗi khi lấy nội dung phim: ${error.message}</p>`;
            console.error("chi tiết lỗi:", error);
        });
}
function showDetails(animeId) {
    const resultsContainer = document.querySelector('.anime');
    const anime = animeList.find(a => a.id === animeId);

    originalContent = resultsContainer.innerHTML;
    resultsContainer.innerHTML = '<p class="loading">đang tải nội dung phim từ gemini...</p>';

    // Danh sách API keys (thay bằng key thực tế của bạn)
    const API_KEYS = [
        "AIzaSyAsPbf4y6Q6rZAgH9QdFII4fz3bvN4TUng",
        "AIzaSyAzCOqtjlg3JmRVpsyOI1I4a7jPSxCfdGg",
        "AIzaSyAKAJDO88SlwBQE-mraLvLgYGyggCinIFc"
    ];
    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    // Prompt yêu cầu Gemini trả về nội dung dưới dạng HTML
    const prompt = `
Hãy cung cấp thông tin chi tiết về anime "${anime.title.english || anime.title.romaji}" phát hành năm ${anime.year} dưới dạng HTML với đúng cấu trúc sau. Đảm bảo nội dung được trình bày rõ ràng, đẹp mắt và không thêm bất kỳ nội dung nào ngoài các phần được yêu cầu. 

Sử dụng các thẻ HTML như <h3>, <p>, <ul>, <li> để định dạng. Khi kết quả trả ra, chỉ trả về văn bản HTML đúng như định dạng dưới đây mà không đặt trong bất kỳ thẻ code nào như \`\`\`html hoặc \`\`\`. Không thêm bất kỳ văn bản giải thích hoặc ghi chú nào.

<h3>tóm tắt</h3>
<p>[Viết 3-5 câu tóm tắt chi tiết cốt truyện chính. Không bao gồm ý kiến cá nhân.]</p>

<h3>nhân vật chính</h3>
<ul>
    <li>[Tên nhân vật 1]: [Mô tả ngắn về vai trò và đặc điểm]</li>
    <li>[Tên nhân vật 2]: [Mô tả ngắn về vai trò và đặc điểm]</li>
    <li>[Tên nhân vật 3]: [Mô tả ngắn về vai trò và đặc điểm]</li>
</ul>

<h3>bối cảnh</h3>
<p>[Mô tả chi tiết về địa điểm, thời gian, và thế giới của anime. Không nhắc đến nhân vật ở đây.]</p>

<h3>điểm nổi bật</h3>
<p>[2-3 câu về các sự kiện, chủ đề, hoặc yếu tố đặc biệt làm anime nổi bật.]</p>

<h3>phong cách</h3>
<p>[Mô tả ngắn về phong cách nghệ thuật, kỹ thuật hoạt hình, hoặc cách kể chuyện đặc trưng.]</p>
`;


    // Hàm gửi yêu cầu với khả năng thử lại với các API key khác
    function tryFetchWithKeys(keys, index = 0) {
        if (index >= keys.length) {
            throw new Error("hết tất cả api key khả dụng");
        }

        const currentKey = keys[index];
        const urlWithKey = `${GEMINI_URL}?key=${currentKey}`;

        return fetch(urlWithKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            })
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 429) { // Too Many Requests
                        console.log(`API key ${currentKey} hết lượt truy cập, chuyển sang key tiếp theo...`);
                        return tryFetchWithKeys(keys, index + 1); // Thử key tiếp theo
                    }
                    return response.text().then(text => {
                        throw new Error(`HTTP error! Status: ${response.status}, Message: ${text}`);
                    });
                }
                return response.json();
            })
            .catch(error => {
                if (error.message.includes("hết tất cả api key")) {
                    throw error; // Nếu hết key, báo lỗi cuối cùng
                }
                return tryFetchWithKeys(keys, index + 1); // Thử key tiếp theo nếu lỗi không phải 429
            });
    }

    // Gửi yêu cầu và xử lý kết quả
    tryFetchWithKeys(API_KEYS)
        .then(data => {
            console.log("Phản hồi từ Gemini API:", data);

            let plot = "<p>nội dung phim không có sẵn.</p>";
            if (data && data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
                plot = data.candidates[0].content.parts[0].text;
            } else if (data && data.error) {
                plot = `<p>lỗi từ api: ${data.error.message}</p>`;
            }

            // Hiển thị thông tin chi tiết với nội dung HTML từ Gemini
            resultsContainer.innerHTML = `
                <div class="card-detail">
                    <h2>${anime.title.english || anime.title.romaji}</h2>
                    <p><strong>năm:</strong> ${anime.year}</p>
                    <p><strong>thể loại:</strong> ${anime.genres.join(", ")}</p>
                    <p><strong>hãng:</strong> ${anime.studios.join(", ")}</p>
                    <div class="plot-section">${plot}</div>
                    <button id="back-btn">quay lại</button>
                </div>
            `;

            // Thêm sự kiện cho nút "Quay lại"
            document.getElementById('back-btn').addEventListener('click', function () {
                resultsContainer.innerHTML = originalContent;
                // Gắn lại sự kiện cho các nút "Tìm hiểu thêm"
                document.querySelectorAll('.detail-btn').forEach(button => {
                    button.addEventListener('click', function () {
                        showDetails(this.id);
                    });
                });
            });
        })
        .catch(error => {
            resultsContainer.innerHTML = `<p>lỗi khi lấy nội dung phim: ${error.message}</p>`;
            console.error("chi tiết lỗi:", error);
        });
}
