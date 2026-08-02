/* =========================================================
   Credits 31–265, scraped from the same Muso.AI profile as
   the 30 curated rows in the markup (popularity order,
   pages 2–9). Kept out of the HTML and built here instead:
   235 rows of markup would add ~200KB to every page load,
   while this file is ~45KB and cacheable.

   Runs after i18n.js and BEFORE main.js on purpose — main.js
   collects rows and [data-player] elements once at startup,
   so anything built here gets players, cursor-preview and
   genre filtering for free, with no rebinding.

   Tuple: [title, artists, roles, year, previewId, spotifyId,
   coverId]. Preview/cover are path fragments of the Spotify
   CDN unless they contain '://' (two covers live on Tidal).
   Empty preview = Muso has no snippet: the row renders with
   a disabled play button. No genre: these rows only show
   under "All" — the 30 curated rows' genres were verified
   per-track, and nothing here has been through that.
   ========================================================= */
(() => {
  'use strict';

  const DATA =
[["GTA (FREESTYLE)","INDABLACK","Mastering · Mixing","2024","0bb438dcb9e6c5e4099e3c63ad291e72f516c250","2dETa4cIXYU0zivJiO3UUV","ab67616d0000b273dc7497b829fd4fb76c8f7341"],
["(Lost) - Intro","INDABLACK","Mastering · Mixing","2025","2cae47807c146177ce4ee461d81a31a7f7274647","2Ry98wRWRIW8WVH0RVKBJw","ab67616d0000b273576bd9889d05693dfd6c6337"],
["Убийца","INDABLACK, BILIK","Mastering · Mixing","2025","e75d5e989319b9809b01d4af6eca012823041005","4VkJi5Fr58O4uR9BRGHtPU","ab67616d0000b273576bd9889d05693dfd6c6337"],
["Иногда","Ришелье","Engineer","2023","b60e05d67c68edde8cafffa3bca5206e6a5b0bc7?cid=5d706a6856e34d3db59a5255085d6762","5dfv4qkRok0lkEDi0wlReT","ab67616d0000b273d7d0b407a37bc31facab38f6"],
["безлад","Kostiuchenko, irlbabee","Mastering","2024","c17f6350bd88628142fd108cd8b3c01ea54283ce","3HMYPpzSJzgAM5wOAXQIF8","ab67616d0000b27344dbf1c9fba5afc27fd90601"],
["Сленг","Zetsu","Engineer · Mastering · Mixing","2024","e1880bae68cd347d0f154f0420ebf7b2f4b6a652","4kUIvqSaSYoffWynxVKTUK","ab67616d0000b273f32becaa70bfff09581042de"],
["Jamon","INDABLACK","Mixing · Mastering","2025","d0d3a764a4c27880405bf2f600124cd7284aef46","1IXH8ssZIfuHLYFcUXCLSt","ab67616d0000b273576bd9889d05693dfd6c6337"],
["Spin 4 Gold","Sw3rve The Realest, Kid Reed","Mastering · Mixing","2022","d778e170c9bd7a13054eadd08ec00b97c69de0f8?cid=eae5b4a442d94acdb71852801cbe8ac0","4Bf1aUsVd8kA5Exxd8ID8D","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["вина","Kostiuchenko","Mastering","2024","ffe13546cfbed2c1bf4b5f16cb4fb0befe43b260","3iTtHm0OQArfJJK8dq2P3N","ab67616d0000b2731b3c265eac859e089a063f70"],
["trenink dela ballera","JACO S!CK","Mastering · Mixing","2025","756d9dc1bc87dbd5f64c54022607956a95342542","3v0f1AnQ3dT14qxtj9Omex","ab67616d0000b27397df8b81cb31954b89f6404f"],
["VIRAL","INDABLACK, FindMyName","Mastering · Mixing","2024","b42c434529bd7837c7994f52b77ef26f646bb3ed","3uQM2BmKZYbwVx6VQmaoqJ","ab67616d0000b273129c1ea5c4408405b088598f"],
["Чего так не хватало","INDABLACK","Mastering · Mixing","2025","0e2b3ffe22a90116b2176654c1569b02338ff8e0","2fAj81fuUGqD8H0nospTx0","ab67616d0000b273576bd9889d05693dfd6c6337"],
["Начинаю забывать","AVAQ","Mastering · Mixing","2025","10299b64afa52771c10b8c7d59733890a34f96b2","7kRQ31e51acxD4704RMH5n","ab67616d0000b2733de09623b43b2bdaa4761df4"],
["Hellboy","Jarry","Mixing · Mastering","2019","0db2ae784fb55a1949bdd0f9ba4322bafe108d76","56nas0oiFstbWHOacZ4sUj","ab67616d0000b273d6612bb97a6cb198fb9dfbda"],
["Impossible","Rodionis","Mastering","2026","ab309e4a4c1b85bfe61694702812087d0ed41a7e","5KS8aSlT4arNL1v5WfcCPf","ab67616d0000b273f701436beceb7e88c7eb87f9"],
["APOLLO - Boris Redwall Remix","INDABLACK, Boris Redwall","Mastering · Mixing","2022","46fa877f07ba063032bb1755238ac5f8aec9d03a?cid=20fa44c982aa4b37bb4907feb2a2f9ae","27L317oCsv19i1otQjpnAi","ab67616d0000b27363a0d5a074f8c053711c8503"],
["Blessed & Thankful","INDABLACK","Mixing · Mastering","2025","fe380c208dd4bf450739d85126bd7115df09d798","2VdoSkxEwwvrdHpZPRdQLX","ab67616d0000b273576bd9889d05693dfd6c6337"],
["номер","Kostiuchenko","Mastering","2024","6dc41d25d7da994c25999accca44c6c0d59fec97","2i4oj1JqJ7fp5qBZZ4S91R","ab67616d0000b2735f4e4bfca12decbb9f563952"],
["No Choice","INDABLACK, lyner","Mixing · Mastering","2025","e3374e8c1e445e2b42e997beac52dea3187d5015","1WbTOuFCslg3z4jNB9dWSr","ab67616d0000b273576bd9889d05693dfd6c6337"],
["Ставка","INDABLACK, Lil Morty","Mastering · Mixing","2025","078aa553fa75e6efb515d204a33ca6c173d8c320","4jMjof7igLwS3C7bDqI0k8","ab67616d0000b273576bd9889d05693dfd6c6337"],
["Не обіцяй","Sms вночi","Mastering · Mixing","2023","aa356fd4dd844532e0b1e81ccb0cf3c4e8ef33ba?cid=06eb1a1b613944a38188af3e8af4d906","1gTcIU8VmQ1TYTQlIlOpgw","ab67616d0000b273873b9cfdb11770b1856ce4fa"],
["ЗАМОВЧИ","BLESS BOI KANA","Mastering · Mixing","2025","205f3903ba9184e7433fd13f7f016d62dc517a62","4tJH1SyYDGNT8BB1lXoN1V","ab67616d0000b273a37d3a1528a68313b31973da"],
["Багровый закат - Outro","INDABLACK","Mixing · Mastering","2025","4980fe032736abae4de5384d0e4778fc813ffb5d","2w0fxR4TwNt5czHTMYR6mH","ab67616d0000b273576bd9889d05693dfd6c6337"],
["Interstellar - Extended Mix","Antony Millnor","Mastering · Mixing","2024","6797a1b9b89d058f80a35afe90e1ea649b5ecc90","22ll5VX8bEqI4n91qAg1JX","ab67616d0000b2739b88462d6cc5fb92eccb706f"],
["Что? Ничего!","Ришелье","Engineer","2023","019e9feb009e918d12ddbcfd2d2c5c2e9bd73ae5?cid=4bbebf4d54a5467db443d3c003c1455f","09pB817ouf2nPNyAjORdk5","ab67616d0000b273a79a7b317f3a3940391f4647"],
["Pockets Heavy","Kid Reed, Unique The Artist","Mastering · Mixing","2022","c7a7a39acb47c2dab43a89b503ee471ae34e7a7c","5pIOJpZ1GktkhpqqoIdSig","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Вообще","Ришелье","Engineer · Mastering · Mixing","2023","2a1c54b1648b724287ccf159599db4d84c20f1d1","5wU0GJCPGsTqoLChTndvye","ab67616d0000b273ddc29c6fe563cff8da5f13ba"],
["Noční jízda","HEY FRANKIE, THEONE, daLore","Mixing · Mastering","2025","113709d8f863c140b9bc0ff3d177c52dfb65efe3","13gG7EkcWZKTuZ4Md1I5WU","ab67616d0000b273f3999ef9070c0995902ff568"],
["Аптека","Ришелье","Mastering · Mixing","2023","e9c03a3b370da4c2207c4c1739f476ef817800a4","6HBuDLVVilpFldcoS2yMRY","ab67616d0000b2731512a5a2cf8ceba826010d00"],
["Не пара","Diessy","Mastering","2025","c6428d0d5445540af0a34c116155d5b5ded2710e","3djhPMg77OBAxldVTI1jYY","ab67616d0000b273867203ceeea7983074361547"],
["WESTSIDE","INDABLACK, Massima","Mastering · Mixing","2024","e5edae62f8ace5eb61e9fd3f4f65059f61320274","4Z2J6LrJYUT8I0VIC7TKem","ab67616d0000b273a5321d2138c985cfe51b163d"],
["SUV","INDABLACK","Mastering · Mixing","2022","46f3b79533372e9779378cf647acc235e8dabccf?cid=9b4affc175de46e5985cb701a8852180","6GrOB9sG5XIJhUwszU1O8E","ab67616d0000b2737fa97999a250c01e65ff0224"],
["kluci","JACO S!CK, youngplayer","Mastering · Mixing","2026","13993cf2a17ba2542058b350e503d68618fa7d36","66SXD5kfdkunwVIBArw4j8","ab67616d0000b27338bb904092ab543858c57ca1"],
["Best Change","INDABLACK","Mastering · Mixing","2022","a2680b1f25205c362488eb0f7e360389c9034d81","2bJ39MeuBEDmXeIpantWAI","ab67616d0000b273331e9b8fac2876a421b3f85a"],
["ВИНОВЕН - Vldk Remix","INDABLACK, VLDK","Mastering · Mixing","2022","56a2a7eeddc3b23285744867c07e75984e1983a7","4OCpcVz1sOvbZui9wK5rs6","ab67616d0000b27363a0d5a074f8c053711c8503"],
["NINA - CVPELLV & Saratovking Remix","Cvpellv, Saratovking, INDABLACK","Mastering · Mixing","2022","bd696d87ff18ceb27613d4f201daa637a3232600?cid=f979651d60fe4c508e27e62308dcba47","6Gq9nz0Fbk6d7Bv0IJRgUG","ab67616d0000b27363a0d5a074f8c053711c8503"],
["BAD - Snowbody Remix","Snowbody, INDABLACK","Mixing · Mastering","2022","d5103e2b92fbd3c2ed1a19003ad28abb10e484a4?cid=a2a3599115d546a595b3502596d29987","4aG8hqLMIFKrhQoX3ZNWJx","ab67616d0000b27363a0d5a074f8c053711c8503"],
["PTSD","INDABLACK","Mastering · Mixing","2025","add5809cf252797967dcebf595394b4d037c2c50","6Du2tjxdEQ4XOmUGmx4whz","ab67616d0000b2730ab284d3e1cabb9c89db0727"],
["ВЕСЬ В БЕЛОМ","INDABLACK","Mastering · Mixing","2024","39e53929ad939ad652c13e12fcaf5750a6ea0cbf","5BLvm1C5r2JYNSSYiukxYg","ab67616d0000b27302a9868c3a370cfb7f73c95f"],
["Я Не Хочу Так Больше","Zetsu","Engineer · Mastering · Mixing","2023","5086374829c45625020bd0f35864c65ebb6c7bf3","4EnnA1710TRFLuwRNhfGqe","ab67616d0000b27308e8804208bcc2e87b394329"],
["ВИНОВЕН - G-POL Remix","INDABLACK, G-POL","Mastering · Mixing","2022","2835c5a161c525e859a6c8b09e7231f99e268fb7?cid=f3ab177206224ca6ac619e99d24568bd","6a85lOAnyVm5BaBIu88moy","ab67616d0000b27363a0d5a074f8c053711c8503"],
["Дицентра","Zetsu","Engineer · Mastering · Mixing","2023","fed766a8394b0f2f1d1ccc31094784f65342cc16?cid=66eed80d60bf45e5b7f952a2e7f32820","1bcuONQOz0idtJvf0I2fKX","ab67616d0000b273946394320249750a9a855d81"],
["Amsterdam","HEY FRANKIE, 1rose","Mastering · Mixing","2024","f409db9672f506a05f055c156d6f1589174a9c29","466VUhxWxxolKkntDNrv0K","ab67616d0000b2735da356887b49a8789a69b847"],
["ВИНОВЕН - Triish Remix","INDABLACK, Triish","Mastering · Mixing","2022","2042c7ef409d195f82a6b37e63d72a2f5681cced","2vWJ5Grcjn7z3dOw8oPVqf","ab67616d0000b27363a0d5a074f8c053711c8503"],
["Исповедь","Zetsu","Mastering · Mixing","2024","3951c7d538d8700fb34a1baf11a15ccebee6cfc6","0f8DBOueWI0OC3b0pYIdGP","ab67616d0000b273a00841c5b694307245979db8"],
["spliff","JACO S!CK, THEONE","Mastering · Mixing","2025","b728132f3df93a76b071225232484f1472a27c73","5WAutUifijc79z5dvrkkEz","ab67616d0000b273bbf58bf2722f41f6078eeb02"],
["PUNCHLINES","JACO S!CK","Mastering · Mixing","2025","7d20fd4679692694a1b4c25b75299935448764a7","0GTxAnSNcZLkdchgvziMap","ab67616d0000b27319c8428e698b1f396540fda0"],
["DIOR - DJ LEWIS Remix","INDABLACK, DJ LEWIS","Mastering · Mixing","2022","57e500d03ee54c56b572606c1693d5c21d08cbd8","5n4ob6Eucuq6nAWERj4YM2","ab67616d0000b27363a0d5a074f8c053711c8503"],
["Тримай мене за руку","KHALUS","Mixing · Mastering","2024","ca8b6cbd4637f9461ce8b99eb1b89ce6c9fcc2c1","1w2Kq1bDqj9hQcuJUyFRtr","ab67616d0000b2735cd5338105e530675e1865b7"],
["Andromeda","HEY FRANKIE, Sayme","Mixing · Mastering","2025","05f30e0736261f0bd4e3f7285c3cefbac7ca0146","2gJ7wtP4oiQILquzByz9by","ab67616d0000b273daa0ef03996dec177c00a06e"],
["RM","BLESS BOI KANA","Mastering · Engineer · Mixing","2024","32019a53636d85c71e3b76148e6b31e4b84259d9","0dZFJhtYIZrwRBsbi8bcwa","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Симфония","Zetsu, Tommi","Mixing · Mastering · Engineer","2023","341c702cb5eaac4456c4f6ecc10f5f1315ec593b","2GomRWdLeoaniaYOHhCqVU","ab67616d0000b273946394320249750a9a855d81"],
["BARS","JACO S!CK, vendisso","Mixing · Mastering","2025","3191e1f547fb90ef2392e78ba2c5abcafb66e52f","4vRvdTrmOrPWTTyZNHCe4h","ab67616d0000b273e503fe19ce8aa211651897d3"],
["Virus","Tommi, Zetsu","Engineer · Mastering · Mixing","2023","644af21a663afc7bf104d2c63026325cfe1671f7","2zAkb0wns7H2AWLnZxN8Tq","ab67616d0000b2733d7f4cf753a293c122ae1c9e"],
["Aint No Way","Sayme","Mastering · Mixing","2025","5e231eb71d2c29132c0e2570e38af268bfe7e31f","3sez1KaNxvIOPIRjBdkr9L","ab67616d0000b273663fe0f74f6384bee10d459c"],
["Не вір","Fabio, MILI","Mastering · Mixing","2025","fdcabc1cef4538008e11bab9db6080db8086fd08","6NKT1vQ1C9Fh0HJZktAwrI","ab67616d0000b27370359be6ca4680146e7a3cfc"],
["SAVE","JACO S!CK, Šimpanz","Mastering · Mixing","2025","135cf4b05ee5c94fb30b01d632fb9e641a120417","3fyLIHECZm0V15HTc7swNP","ab67616d0000b273bac4df023bdc82d4ff0f27a1"],
["díky bohu","JACO S!CK, youngplayer","Mastering · Mixing","2026","abc6182d41ff2a50fc9010e466c49ccb882c9040","0CJJw40kuwI4DoC8m8i2em","ab67616d0000b273d0590cb4050f71a80ddd9b87"],
["НА БЛЕ$$I","KANA","Mastering · Mixing","2023","dd1b24ee44d8122611547f4103015306dd606f50?cid=53a3674817b54c2a97d46221ae780606","7Elilg2xb115fg230qIPfO","ab67616d0000b2739e6e456e9c6abd559dddb1d4"],
["z paneláku (feat. Šimpanz)","JACO S!CK, youngplayer, Šimpanz","Mastering · Mixing","2026","aa0bda1fcced6120430ee01eef898beb8b821901","14WhyptmLZ6D3HbFgyKv8a","ab67616d0000b2732561abe6c30fdefbfc173961"],
["Слишком","AVAQ","Mixing · Mastering","2025","8f4d948343d74a83d7a2ed513098b5256b4ad6f4","5Sh0A1GnTMZf9eWiuP7Sny","ab67616d0000b273e91996a9a8994d5748eac1e9"],
["Краще моїх снів","BLESS BOI KANA","Mastering · Engineer · Mixing","2024","c3a1c65449b047d228208900c9aee1d1757794da?cid=11aa7cca806d445a94e0116c45188c95","0h4FDODpKNFDgvNTXoxbL1","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Нет сердца","INDABLACK, Omaru, Daylor","Mastering · Mixing","2023","826f31211bd7d52bd2519311a907fa5a614cc2bb?cid=64bec9e603974a04b9f8f948a9aa7105","7mxNU6IPnJeR1LBzaj6zmJ","ab67616d0000b2739078dc150ae93187ebe14eba"],
["безхатько","Kostiuchenko","Mastering","2024","9c949d1b736dd5ef356ab5a3058b4c3f52ffdcb3","1tQvZHIKXuVSCi1acwXtKO","ab67616d0000b273ca8c5256489d6d3b88e75995"],
["Замерзаю","Zetsu","Engineer · Mastering · Mixing","2022","eb7ddd31de7c6ac1d384d4f8447952f677660fab","2Td7PqfQPB4tTef5eI45Co","ab67616d0000b2731c0cebaafdb123fb042bff0d"],
["Техас","Ришелье","Mixing · Mastering","2024","c4867d5f361dd32dc80960352b2a85a952977340","4RDRkkbg4l874vzfeR2fQx","ab67616d0000b27316ae88110e8bbd75825ebb09"],
["must replace u","BLESS BOI KANA","Mixing · Engineer · Mastering","2024","756ec03e54c3861aecf3a51854416dea326dff15","1JnevzG4iouJrdJFsrgK8K","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Romance","Zetsu, Tommi","Mastering · Mixing · Engineer","2024","617a3cb87249d3ca020a074d800d0aa4031d4fa9","3xbqE7ieY8KCHxD9zIAN0U","ab67616d0000b273557eea93be6df71fa60d5162"],
["Мой Дом","BOSAKOVSKY","Mastering · Mixing · Engineer","2023","5aba703b55ad43c10f7211f94db8a7551073b52a","4DtGlfB6LmXNj6QyrUqy9u","ab67616d0000b27307c383a9b47962c8e282b720"],
["Лиши меня эмоций - Speed Up","Zetsu","Mastering · Engineer · Mixing","2024","d0fa0eec9fe0fa75870484183b14b4632a2844e4","0cJfFdZbgWLv5HnatYwvGG","ab67616d0000b273f188b096f4bad9dab4fa123b"],
["PLAYER","BLESS BOI KANA","Mixing · Mastering","2025","eb27c16168a26c8078d905744b716a67687ad315","1ldN5OcQKxLQbTUx6XqMtN","ab67616d0000b273da76190fc350a2468340dcc5"],
["Pushed Thru","Kid Reed","Mixing · Mastering","2022","bbd0b8bc8df4130f15d37b0c9548b1fcff303e5c","0Th3GHnvEOpkPUmbeaWnS5","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Тату на серці","Sms вночi","Mixing · Mastering","2023","3244ac4525c74731a082c6f0f9988574c2c156dd?cid=be87633042d64d8993c16e66b9035ffa","1AmLSfHzT8zmWvZWYsS5mO","ab67616d0000b2736268b65288a9d39d2c80a08c"],
["Alien Girl","BLAZENB","Mixing · Mastering · Engineer","2023","e9168c684d773507dff263c19af2d5eeda2787fc","2VAiGIgdn8ojwgGMkOThUq","ab67616d0000b2738b7e006004676c5beaa34301"],
["Ким же я став","BLESS BOI KANA","Engineer · Mastering · Mixing","2024","ff819d1ca6650d4e332a46b709ee32aa086a2177","4ujjSWNhcIqkdfZ9cVNEmd","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Ненавиджу сонце","BLESS BOI KANA","Engineer · Mastering · Mixing","2024","facf41210c31722a7f05ed24acf4a1c1a6afc41a","5hMUzv30JqzSIMUaKnweKQ","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Астрал","Zetsu","Mastering · Engineer · Mixing","2023","48126b51bd3898acd91c9c16e791f7a5e90bd537?cid=9d9439b1726041b791ed26853180f72d","2p9QAkNbvYGQN6EmSMi5C5","ab67616d0000b273946394320249750a9a855d81"],
["On da swag iconic","BLESS BOI KANA","Mixing · Engineer · Mastering","2024","f0e2349ff50c4ea8fffe283c755f7d16fbe3742f?cid=ae4992f78a3343bea3b741ebb8f56133","7uvHtvQUKoWvdWxDLBJFZV","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["real underground shit","JACO S!CK, youngplayer","Mastering · Mixing","2026","4b9f11184403d1bdeb25823a2a7cbaf2862cc5b8","3VuArLQMPI2cdmtOCRHtda","ab67616d0000b2732561abe6c30fdefbfc173961"],
["Облик","Zetsu","Mixing · Mastering · Engineer","2023","4e780f70821fca416dd1aab0f5b3f8c1f4cbdb2a?cid=20fa44c982aa4b37bb4907feb2a2f9ae","1PyktbLo3ddoZzbp2buASL","ab67616d0000b273946394320249750a9a855d81"],
["Business","Kid Reed","Mastering · Mixing","2022","db15440d0d738ad916b12537bace1ac3216c46b5","0p2s50fNWNFKEKKlIDVPO8","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Infinite - Extended Mix","Antony Millnor","Mastering · Mixing","2024","ed1e081d4ac06cef0cb6338ca052d1010a15f6b3","4WwiXa8nsHhVGsR1Qd1hNS","ab67616d0000b273197d00a3a208a15f284542a2"],
["Дуди","BLESS BOI KANA, lilboislime","Mastering · Engineer · Mixing","2024","7500ae2f8304e3912f9b649dc7e922a3c4c2716f","3lZ7STXif0RnnsUkFsU8ww","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["prague paradise","JACO S!CK, youngplayer","Mastering · Mixing","2026","5062f98c5b914f7d1af884ae42b0024d5134e91a","7hfELj1qxhWnwxuUX46SIV","ab67616d0000b273d0590cb4050f71a80ddd9b87"],
["45 bitches","BLESS BOI KANA","Engineer · Mastering · Mixing","2024","510022d0302827f5bd70c686e6217f88982dd145","3yqBCxcV2sVIBzOyjfXkTC","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Кольт","Zetsu","Mixing · Engineer · Mastering","2023","2ed2e041890cf4f56e4c4fb04a79d39dd151728e","1OsTzo5siFrjQCePZYdYvD","ab67616d0000b273946394320249750a9a855d81"],
["BUGGIN","Kid Reed, BNBZERO","Mixing · Mastering","2022","b9cbaf8c27515e54b3066c92e75410eacb6eaf7f?cid=be87633042d64d8993c16e66b9035ffa","17R0XQmZxCwTOuqqi8UuiK","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Thriller","id13, Паша Пм, DNDY","Mastering · Mixing · Engineer","2023","423983e25893d08f7d561e704c352276c3a81320","3QK1KXx3RpCfuwOAlAkvct","ab67616d0000b273580f0c8566f8e8659f166b79"],
["Level Up","TRISHA","Engineer · Mastering · Mixing","2021","31227c80683d07d7a40eb12c6b3d8876ceb7e8a4","3nhUK4ufeN9sLEciruaDCB","ab67616d0000b2739c28d5da68eaf8ebeb010311"],
["MAYHEM","COPIS STORM, Zetsu, LNGLVL, BOSAKOVSKY, 840PLAYA, Hanzo98, Tommi","Mixing","2023","61158d2d6bd1c1ccdc35cb22d95527e59a95d484?cid=a530ef716c2040508454a76658c643d2","3TmWTpWAhikl3nPIRBagKO","ab67616d0000b27349dacced05951ba87640ad82"],
["Shoot From The Hip","Kid Reed","Mastering · Mixing","2022","a92d4b138f339e93cf7dcc2608a9a6c770c95927","6L7oezpQMH231rlAWCVwRd","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["better than your ex.next","BLESS BOI KANA","Engineer · Mastering · Mixing","2024","3db38ff156cb3d4e388b0dd6954e0df5f68755cb","5NuxUIODkHpG0rpRtwgaAI","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["sem tak high","JACO S!CK, youngplayer","Mastering · Mixing","2026","bc02f0d1101cd39489afc5f6f041e2fa0b1a72c0","71F4nDGloyWAB4YPghuglK","ab67616d0000b273d0590cb4050f71a80ddd9b87"],
["Chuckyy","Kid Reed","Mixing · Mastering","2022","59ddf63fb64e9d16dc004b52a0147f3d6152d47a","3D0peL3rwKDsdQqjK5UDZ4","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Напутали","Tommi","Engineer · Mastering · Mixing","2023","ea141bddd936022f4b589e45843e1675b690ea27?cid=df66f6db30ba4dc39324c861ed373473","5ix89tpfed1SKvhMc7b7he","ab67616d0000b27328aef4fd735fbe1824d4b5b7"],
["On da big godbless","BLESS BOI KANA","Mixing · Engineer · Mastering","2024","6087991894fad5a4133038c56161a5aac1683607","1G8uB3uT7nU2nni0V24qSW","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Из комнаты","Ришелье","Mixing · Mastering","2024","116cac89c2cc45a7b7ae77002ed1a2b60f085266","50qFYE71G9SYeWe11aLdcS","ab67616d0000b273ec5cfd0e1aa3bde299f0d021"],
["Mute","Enythe, Antony Millnor","Mixing · Mastering","2024","b207960230a47678c5e428ef0a5d1dc6f456ef76","07TaTg79kgM9lHXj7dKw76","ab67616d0000b273acedf5b93d102493b2e514a9"],
["Нічого не кажи - Intro","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","817e6f33550e1f8f94fdeeccb640e0adc2a3d288?cid=43462d8a5f4c45b88dc34acec32c77de","3BNBdOmx7oPE1m1U78Cven","ab67616d0000b2739a496170c1ce46ab34358608"],
["2 da m00n","Zetsu","Engineer · Mastering · Mixing","2023","890978e12c3fd220a864ebbbda62381dfb7f7d08?cid=b0fda13267864667a63f6b4069692810","4ReCwi5J8A8gZbeRAxmnWC","ab67616d0000b2735ef00a9083c002d3c465b93c"],
["díky bohu ll","JACO S!CK, youngplayer","Mixing · Mastering","2026","c8c272265cbf251e658074956df26bce3c52b9e6","7Bzvu8rSRe8TE49B7JlOnV","ab67616d0000b2732561abe6c30fdefbfc173961"],
["Три точки","KA$PR","Mastering · Mixing","2024","928ca2b6e9a687d2bd8cb4b189dafaac5bc655f3","3i2t0VhmcnfJ1MyBIUkk8h","ab67616d0000b273f14da657521d87b795e676fb"],
["Не питай мене","BLESS BOI KANA","Mixing · Engineer · Mastering","2024","2fedf3e3364b8db653e832e21f2b4e50156d304d","0T4lPgcfHvP2QSO9kcG1f5","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["Зорi","Rea1see, Tony Luminous","Mastering · Mixing","2023","89ae1a72712c938e214e402f19433d605b003361","5xE78kqLmQSKNSTttPu6oJ","ab67616d0000b2737c48d46f0bc243a87036cb41"],
["Streetz","Kid Reed","Mixing · Mastering","2022","e464f40a19f4490e2d2cac4f7bf95a3879b419c3?cid=82b7d3ee96ab4f9e98fd9a7e41d6f0c8","0uK34o8QLOkJ8AqpzCNt2l","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Soul Girl","TRISHA","Mastering · Mixing · Engineer","2021","e45ac5a6e461daa65e92030a3759b6b17bbbb9cb","3idfRNodvteq73zrFAJ8Vq","ab67616d0000b2732fa929cf8d8a7aa806b0d676"],
["TIME LIMIT","RIOT","Mastering · Mixing","2023","8f4052a452ad6acd3d5f6a2729c643d1c08e3bcb","4aQ2H0454WFr9JIo3QGmX3","ab67616d0000b273c1dae2fe2f096d2e0803793f"],
["DIOR - Triish Remix","INDABLACK, Triish","Mixing · Mastering","2022","dbe226fe22eecd3288962fb84d886627eae12400","3f7x6ObFmMU0vG8g3l5kLs","ab67616d0000b27363a0d5a074f8c053711c8503"],
["Послухай","BLESS BOI KANA, lilboislime","Mastering · Engineer · Mixing","2024","f660734c0f6a276d8f43c8f70888eb93e8bf993d","5MCqyqEUW28ZUSD1IqllfN","ab67616d0000b27330607e9e6e25f4b77be7bd16"],
["ДЯКУЮ!","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","01ba81068886dee7cb9f74d6c6d674d51e47ff13?cid=d43eb3016e6046b9a6719204525c53fd","66ooPDeKaXtLWlOztHafAE","ab67616d0000b2739a496170c1ce46ab34358608"],
["Коробка","AVAQ","Mastering · Mixing","2025","a4d9da43cec7cf48607cf2498c44aa615561d7c7","7MCJxY2S85KViRlEuvxjIa","ab67616d0000b2736a3965ecaa33003c0332a04a"],
["WEEKEND","Kid Reed","Mixing · Mastering","2022","47213d92ffb1ec8debe0b531eb3f9bbbb730910c","09lGueYN1ITAKxBdscX6fx","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["One ME","Kid Reed","Mastering · Mixing","2022","90325b70307f6e9eb052692650e1c00d48d9f76b?cid=dc0fe52e6b88473da8f53380bd2e06a3","7q7AaxZov4xMOOAkU3Lcff","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Первым делом","Ришелье","Mixing · Mastering","2025","d937dc056fbaadec646df934bba53197a1a997c4","0bcpDPT24MOrACxEJjwItk","ab67616d0000b273071e1be285d2ef7c5f9b486f"],
["Битый огурец","RARITI","Mastering · Mixing · Engineer","2021","f98ed7284893ea45f79f825908b4941346b0df28?cid=c25c3900334946a2947dd3c8f65c65a9","1tbpOINbSQyX6WKGde8P3q","ab67616d0000b273ae446f8b3c6dafc6faefaa6c"],
["nemuzou mit co mame","JACO S!CK","Mastering · Mixing","2025","789a2d17422ced09311533bd95e52f1dd1824c26","4OuOq0njpsYcwrpKlyTHe7","ab67616d0000b2739c4543c3809dbaaddfd305cc"],
["Что-то больше чем любовь","Diessy","Mastering","2025","635807ee1d9582b8a965ab15be42eca314141d4a","5cmdX4qHIxZKWsmsgxJW0s","ab67616d0000b273867203ceeea7983074361547"],
["Gamble","Kid Reed","Mastering · Mixing","2022","fcdc951bac8362fb53eeda26809300c1e70e51ca","3Q2f50qaU1JH0SMhU7hWEe","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Tears on AP - .223","BLESS BOI KANA","Mastering · Mixing","2023","7777a75430577fbf90bc770cffb1da47c6769332?cid=b79421f3752c408e9808a18c6a848d5b","2sK4CJcEBP61u5NdRN9xdi","ab67616d0000b273c6122895dfb36063098dd2bf"],
["Fruit Ninja","Kid Reed, Cozyboix","Mastering · Mixing","2022","4af95e4dffac9ba43f2a78a45062a09efb8027bf","7L7I1vqS7fvzVuCmNszZdN","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["OUT DONE","Kid Reed","Mastering · Mixing","2022","6bb71ed5d422589a54a868e69dd93ebcdafb3556?cid=fdaf0c5afb3e48d69f882ce6b671e0bc","68KXDxSgkvqp5Sp2Tg7fjX","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["Оставь меня в покое","Diessy","Mastering","2025","ba914d92cb68683e113298d91736127a31ac62f6","16mpFmRFGXi1uExkYRONC8","ab67616d0000b273867203ceeea7983074361547"],
["U GOT NOTHIN","Kid Reed","Mastering · Mixing","2022","41fa3701a003f3cbe59a7819c6ae8734a33044ee?cid=bdaf74142bc240cfbcf451bc4a8df9a7","4yh0IDNALJXFebRCV60Q8p","ab67616d0000b273c99e7563ed2a9f0d179b7829"],
["ПРАВДА","BOSAKOVSKY","Mixing · Engineer · Mastering","2023","d10eb59c29c822c18bab81300934cece6e2f8ea9","32oSIdg81RXDRMj5WPoZ9q","ab67616d0000b2731ab8c1aecc4b46aafb33e900"],
["Nostalgia","Lex McQueen","Mixing · Mastering","2024","84e39faabe725dc780dff7c10acc7bf6bbd88720?cid=8a6fbefef43c4e01b8c8ada444b7ce27","2fjFT9lkK7uFIDx7s0x51f","ab67616d0000b2730fc9777539ee7c96983b86c4"],
["пепел, сердце и лёгкие","Cash Doll","Mixing · Mastering","2023","7c645f8a89b199fc6c8e2d92dc888ba709bdbe32?cid=14281a271ac44a4f8abf52d30647434b","6zSdUlRt5jQGyNv2gtVNAu","ab67616d0000b27343acb9cceedde0fc97922927"],
["Bless Boi Kid","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","a469f5197b3bde3c894e0bc35efd034cca34023a","2jKYRRp50crkEaOVXH77kW","ab67616d0000b2739a496170c1ce46ab34358608"],
["TAXI","Lex McQueen","Mixing · Mastering · Engineer","2023","17ecf847ec4d1ef830f5e9f027ffa7ab10adf40c","108LyOHfFjDrlREyrJKV17","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Sun and Moon","Ua Kid","Mixing · Mastering · Engineer","2022","e9096b8d4a6d6ee56a10f8bd4a0f543a630f69f7","4WC2dFYwZxvxVRyvutw2TS","ab67616d0000b273d36ef90fcbcafc3a9702556b"],
["SALUT","KRIVDA","Mastering · Mixing","2026","16befeb05ba112e94a7dc92d4c4ee47ab08201ee","5sBX2icRv9o5PxdGEOUHjb","https://resources.tidal.com/images/dac36614/956f/4566/8c3e/d09ae82ce8d8/640x640.jpg"],
["Прям в рот","WASPY","Producer","2022","3abaa8a6ae6f416880fff7ac0eed14873ffac1d2?cid=fdaf0c5afb3e48d69f882ce6b671e0bc","1aVCGx8xjQ6bxa7BHckr5V","ab67616d0000b27318d0c9114b75defdf74c0ef0"],
["Планетарий (Prod. by VHQ)","Niko Baro","Mastering","2021","d3fabea7d55862920af7e4b10e819fbd79aabb78?cid=7a24488554b444199f44d0cb5ebe4b02","7jRo1R6eapQHxfPIVmwHym","ab67616d0000b2730ac1c395345423f9cb8bd23e"],
["Ничего личного","Tommi","Engineer · Mastering · Mixing","2023","7a7bbc660a6b8371b2a48edb4688e9e8805c163c","4nGYrkRyqWjlLeoRc96mNX","ab67616d0000b27328aef4fd735fbe1824d4b5b7"],
["Оплата прошла успешно","LATEONDATE","Mixing · Mastering","2024","01e13b1adc591cef2063cdc523df63645667d1ba","3bQkUHOQz5ud4stIBulm4h","ab67616d0000b273869a017ecd108a8472a71797"],
["OG Kush","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","bbb4a120eb53ee216ef91024553bb83c88c10397","221qi1IDsCkBXcI6dWyJCG","ab67616d0000b2739a496170c1ce46ab34358608"],
["DUFFLE BAG","Lex McQueen","Mastering · Mixing · Engineer","2023","3eb420f8aeaa508682c4ae4ab20106186837b2e5?cid=a5b6d936f03b48aa884ab12e190dc030","2Nx74qCyv1iN29rkdXW8VH","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["лондон","Cash Doll","Mastering · Mixing","2023","b9f3bc6470ee8eba15eebe7a7ca428662b30296f?cid=bab6d48239fa4c67a639f63be39816f1","12YmLHt6Fj8JTCFbYhxwfg","ab67616d0000b27343acb9cceedde0fc97922927"],
["Infinite","Antony Millnor","Mastering · Mixing","2024","638d5d95b953f0a27decf9acb2aa7fbeec312daf","4UfXkSiN0D1NhAus5PP9rp","ab67616d0000b273197d00a3a208a15f284542a2"],
["лодочник","Cash Doll","Mixing · Mastering","2023","6a04a0801fa898332250aff39bd245407d3eb9ea","2EKfxzVXiSBi71eIeZ8UvQ","ab67616d0000b27343acb9cceedde0fc97922927"],
["Broke-Baller","kalciry","Producer","2019","89fecfe3610bc2e7a92e8a45e604ec182dcd1c94","4bu7CazvHrzFB2xTEMbqNF","ab67616d0000b273d60f3a62b11cba1ae2502b9f"],
["Casablanca (Prod. by VHQ)","Niko Baro","Mastering","2021","c18596202f88826dfc23e3bfc2d3dbe15dc30022","7oCb5fP8p1HBYsEQVIk0bx","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["Снова я один","Diessy","Mastering","2025","c4646db59226822ddedc6cbd904ebabe8bbc3373","30qqMU2177ZZx8xwdlwG2Z","ab67616d0000b273867203ceeea7983074361547"],
["Тверская","Niko Baro","Mastering","2021","3c52646ac631801ae14c4c50f027dcb59f54e97e","7LpvSorCjBecSBIUn2IQlB","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["Wo Wo Wo","Гурский, MSTPD","Featured Artist","2020","7e6b93d2a5f2917ecdce015a9556a2da1f8634bc?cid=2986db4e75af4fd88ed016640b575e7f","4iVBuMOm9kGkBipbueOCmp","ab67616d0000b2732eea42d1f25bad729e10ef43"],
["Опиаты","AVAQ","Mastering · Mixing","2025","2cf190d68629cfe8f01cd385b9ab9c5d01238040","4owfc2H6XatV3DavO3v5oa","ab67616d0000b2732177093c2a4fe0ad41086232"],
["Swimming Pool","Lex McQueen","Mixing · Mastering","2024","e1aaea9233558dafc8a743a454b8252eb4615788","1UgbZ4EdEyAyy6IiR2pRxb","ab67616d0000b2730fc9777539ee7c96983b86c4"],
["коллекционер","Cash Doll","Mastering · Mixing","2023","f02655ca8927757149b7e266c5ab11f4c5847ebf?cid=1803033d0ca14a87803f0e18021f669f","1p54cySe6hfSauzAdafDGi","ab67616d0000b27343acb9cceedde0fc97922927"],
["Выдумал","Tommi","Engineer · Mastering · Mixing","2023","bdb3e02d9a0848312917188c220f913e05103d3e","6oZUzqoxEzL1pz0RS5AMg5","ab67616d0000b27328aef4fd735fbe1824d4b5b7"],
["CHECKPOINT","Lex McQueen","Mastering · Mixing · Engineer","2023","b3be4ecc56d32e1ddfd3db8f844518d731cb9474","2xMZEqqfQFEFY0P6Euqjjq","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Freestyle Session","MSTPD, Tommi","Primary Artist · Composer","2021","66489eb1263aa274e513e8b3e0a3d26ecd729c8e","2Z3m3CLtTa2glcoIQkVhjQ","ab67616d0000b273f9d27a711437f619f74f2a88"],
["Mercedes (Prod. by VHQ)","Niko Baro","Mastering","2021","f5e22b3e8c7db9379d175dbb15d17b594f9a48ce","11DoxS2cVMmjwC66Yo3Avq","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["Big Kid","Lex McQueen","Mixing · Mastering","2024","9221404aa7d43cac0c4036e8de9e97b1cbe7ba6e","3GaQ404s4MB0Wz7bX3oeBk","ab67616d0000b2730fc9777539ee7c96983b86c4"],
["Know How","Gans","Engineer · Mixing · Mastering","2021","8e6d53e2b481cf9b722bb743c2bf484371165fcc","7mB7snMKIUekxdJKraXl0X","ab67616d0000b2737e18853a96001fcbba0d934d"],
["MEZZO","Lex McQueen","Mastering · Engineer · Mixing","2023","09e9f17359cda6792bc9b5f7a1bb21a112ad8c32","60p23ufXlDnHR3tnCHc8zw","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Рассветы","RARITI, Esti","Engineer","2021","6cf94f6c1d31689e4434cf25751d31f9e398c467","2JACvdpXp7MKPJvA5ZMhWs","ab67616d0000b273d7b7459ca83bfabc55aa9e44"],
["Не Бери у Голову","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","3a139eafd0b18bb7980521fb8c16c22479f78fea","2LsLN53uSmk40pirDlwYsW","ab67616d0000b2739a496170c1ce46ab34358608"],
["Energy","Ua Kid","Mixing · Engineer · Mastering","2022","3976918fc725a42c6658a537ef6865b454280511?cid=39f90f58c9dd46679db185c94260c985","7MjZp3PcgFkPBxBOZz7kNM","ab67616d0000b273d36ef90fcbcafc3a9702556b"],
["Enough for me","Brogues","Mixing · Engineer · Mastering","2020","ade498c3cabcaa6e9f77bab2edaf42ee246f0fdf?cid=3b77e58597ac45bab3e9c007746be975","6tiEQaNlfCP0OhykSVQ0EB","ab67616d0000b27390477a27a3b69be459007a8d"],
["Медовий Блант","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","aa490dba454411119e20a186bfb36ad6c7d4ab47","7DybzAlfnBMTrLGhtK4xe6","ab67616d0000b273a0786a683d968415dff33eef"],
["STELLA","Lex McQueen","Mixing · Mastering · Engineer","2023","ddbe193b89bb1d18793cbeab4b685b5ecb45a04f","74vJLgPoZuRjoiaJTk6rok","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["COLISEUM","Lex McQueen","Mixing · Mastering · Engineer","2023","2340952401bc6739506ef0306657f91e51b4f391","0nTqANz2rvpA2hSVMvLL9y","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["OKAY","BLAZENB","Mixing · Mastering","2024","3af15e941ebf7700e941633333893090a1cc905b?cid=d8b8eee412824b8ea221795fe18e3ad5","48eOR28AxLPcNsSAw2Dsz7","ab67616d0000b2738529624c389a6372076bbca9"],
["Mute - Extended Mix","Enythe, Antony Millnor","Mixing · Mastering","2024","529222eb9859e50881a46e82a170aabbf67103a7","6R607BshPvlM3aUzsqBphS","ab67616d0000b273acedf5b93d102493b2e514a9"],
["SS Freestyle / Medicine","Brogues","Engineer · Mixing · Mastering","2020","7410ca41595ca4703c6dd54a287565b0113de28b?cid=33ac235a7d7143b1a2e3566376547e76","2MySHlazXYHXjTNL2yzqsT","ab67616d0000b273681d779b19fc3490b3afd409"],
["DIOR","Makeeva69","Engineer · Mastering · Mixing","2022","ec269bb50437e79b623de71a02e7d8726dde1f76?cid=64fc11b97d3140d485c4802d395794e0","2X1WuXd5eS1P5BM2fLihBJ","ab67616d0000b27305a0e48afd0e94dce9832e33"],
["Платье","AVAQ","Mastering · Mixing","2025","89c8f701b7cf71fbf66874ff42e337589fbb08f4","63lswic7hwW9n8YWcfhRCX","ab67616d0000b27338dbe3e883b4e4011a7a776d"],
["Party","EXXXTRAÑO","Composer","2019","7fde4145bcc48844ba57f58f1f23bc53e6bc5059","2QBZErAgkyCbnazHQeJAlb","ab67616d0000b273afe99beda55b135be869a55b"],
["Freestyle","Diessy","Mastering","2025","5a819b5ab57afcb77761e3a559b0acb12eadf2f7","1kQL52T4KLBFeEZvlgPaaT","ab67616d0000b273867203ceeea7983074361547"],
["Voyage","Loko216, Zaza","Engineer · Mastering · Mixing","2022","6d34da82275b653c2fc3beb87949cae004e19934?cid=ac057b22c4414d2c984009f4586150dd","74Ckh5nSpM56kXe3lC81au","ab67616d0000b2737dbe116190c0088da5652dc7"],
["Dirty Diana","Ua Kid","Engineer · Mixing · Mastering","2022","aac15e6ec27e9d644d58dc8891f4c22900366e99","4mlfRuywYVfqfHMrwxzcxZ","ab67616d0000b273d36ef90fcbcafc3a9702556b"],
["HENDRIX","Lex McQueen","Mastering · Engineer · Mixing","2023","e6774a505e826a434aadf790779b923d8df87157","0uf7ydumegeWYmOSnlU9xB","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Эскиз","Zetsu","Engineer · Mastering · Mixing","2023","5427dedfe8fd4b5151a893c099d6e4f26a8bc16e","4eIfoGA6y2Nov0oUJdyqfG","ab67616d0000b273e0c70fcc72b3fa2385f11fe7"],
["кома","Cash Doll","Mixing · Mastering","2023","84a72bccd063e7ff3472ef402379ec93b9c4ecc0?cid=f3ab177206224ca6ac619e99d24568bd","2Bs2vkdMzDE3Jxu8wB7bp5","ab67616d0000b27343acb9cceedde0fc97922927"],
["DNA","Niko Baro","Mastering","2021","54c6e8497821a3f3982adabe6ad63fd4d881c2a7?cid=f554485310c14ff6bff9fb8b8aff9241","2ldCYg1OOkekwyngef2dZP","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["LMAO!","Lex McQueen","Mixing · Mastering · Engineer","2023","590b179c6268ba3f8904fcd0d9b696f7a5151218?cid=3c7c077d34694059a7154c0c41896efa","71CMuumrwfS2AtqpyxuYlU","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Lifestyle","Rihman Baby, Yungdripzzz","Engineer","2021","8d1b014676c74ea31d6edaa40b158209a91651dd?cid=09d2056fa31a4ea881dc20bdd9ddbfa2","5eEAcARPHQj3xADq1rHIma","ab67616d0000b273ef87f15f4e1a3bee4b68ca0e"],
["Кто я теперь","LATEONDATE","Mixing · Mastering","2024","628e82d1b213bcf4d7f0cc9b06d2822e4442c377","4fBjcaJNNbBqrK2dvuSUNN","ab67616d0000b273869a017ecd108a8472a71797"],
["YUMMY","COPIS STORM","Mastering · Mixing · Engineer","2023","94f07b653a33f6fcab45614200ce13225895ddd3?cid=77f4355bab1d406cad403f5503c6be49","14QSNBMN8BTVQkRaGAUTNg","ab67616d0000b273e982f31d9731525721152ccd"],
["Прощай","Tommi","Mixing · Mastering · Engineer","2022","482c1798fab9840aed0fefa3d2d3d439f08b1fb2","4BplK5RO4Optq8GbYX2wBS","ab67616d0000b273d4ec156f9274fe0d65a7bc9d"],
["На запястье (Фристайл)","Ришелье","Engineer","2021","b42e85406a565d0bdcca2daad8ccadd514f1f0ba","7F1Opy84wpydnprIgKukwU","ab67616d0000b273c3fb18c3357356c981fb3e42"],
["Fly guy","Niko Baro","Mastering","2021","9ff204aaf7e9a6b3728a0b7986f175d4a6e14219","6m6IWrFoQxoJckkD4pFIEo","ab67616d0000b273878e5471efef6482bef0d34e"],
["DUBAI DRILL","COPIS STORM, MadMasters","Mastering · Mixing · Engineer","2023","a9539937b9b4d2c103394126db4fbeb578fcbcda?cid=59d8d6f2651946ef9d0c788730ac787e","0gNvwlhKgbYd2uAt3V5Amv","ab67616d0000b273e982f31d9731525721152ccd"],
["Patek Philippe","Ua Kid","Mastering · Mixing · Engineer","2022","98e0df1a5db306f39f42050eed8efda57b232f2e","3gQltCT5w3gp34UsQKagKa","ab67616d0000b273d36ef90fcbcafc3a9702556b"],
["Kodak","Onkatsu","Producer","2021","bb9aa049e3f86642064fa1e16225a3895f2172db?cid=ea8ee1ef286a41d2840411d1927ecd2e","2Qqv2Lu2jGGcyobM2pMNFZ","ab67616d0000b2737224aae32de560f104bf1c1f"],
["Разговор с самим собой","Zetsu","Mixing · Engineer · Mastering","2023","049b98b8c8a9ad543c4c761be5fcf16a751571eb","4Ndz8qDQJZ8AJ5slNaiBMj","ab67616d0000b273946394320249750a9a855d81"],
["Ice Creem (Remix)","COPIS STORM, Antony Millnor, MSTPD","Featured Artist","2020","a29171508f05742e3f52642587b6ef376e6f5855?cid=a50de158b7af499f95129e124de67025","5B4dxGvpRVItr3hxP3mgm5","ab67616d0000b27352778ea4bdc0d64472934f05"],
["ОДИН ЦЕНТ","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","4f94c0b93ef178fbf05f4c7d8f1b2d8d777c09be","7c4MHqocjYG2BperGPvSlO","ab67616d0000b2739a496170c1ce46ab34358608"],
["KNOCK KNOCK","Lex McQueen","Mastering · Mixing · Engineer","2023","a4944d4d3257e37ade503d005b6056023f4e7f98?cid=5b3cf1fd408749f7ab2524baa892623e","2DqHBlhdw8W6vos0jQNAGn","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["В холодильнике","Tommi","Mastering · Engineer · Mixing","2023","e3fe2f5551c077c4d825e2b671434067f64e6f14?cid=0c921d68e36d4ef7bdf72aaae569da22","41EcwtHAFwmG0evw9BxC4M","ab67616d0000b2739ef8b6804e369788f346b17f"],
["Не шукай","КЛЕЙНОДИ","Engineer · Mastering","2022","669cbfbbba1a0cb84f78501745db5eb164bf8c7b","3vzXa4OvNqvSDSPKmwUlWi","ab67616d0000b273d9136aa5b76b557caf9bf76c"],
["Прыгнуть в окно","Yaga","Composer","2018","0ea5d1566887f5fc0455f55332499caae3079e80?cid=4c9da7723c394d35aed2cf5cfc999f9d","17tBHigCnf4R2EKWi1kAxH","ab67616d0000b2739b906d1e94ed6fde0df2ca71"],
["Берсерк","Zetsu","Mastering · Mixing · Engineer","2023","7a7c70e36e3e75e18d4e741c694fb52c7ccca714","3kwxA6hXN8EvRZQ1yNHDpG","ab67616d0000b273946394320249750a9a855d81"],
["Змей","LATEONDATE","Mixing · Mastering","2024","c062900600fa82aae41bbb0211a9b9249f8d3afe","2RnDZL9Kbkievfn9tXlCM8","ab67616d0000b273869a017ecd108a8472a71797"],
["Mercedes (Slow Mo)","Niko Baro","Mastering","2021","dfa7e63e4ad82a02a37f4b403487f1c2b4e0a981","7kq3TrAR4JHttlnEgQgfim","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["НЕ ОТПУСТИТ","COPIS STORM","Mastering · Engineer · Mixing","2023","b88f790e15555a519554f5fcc211e40fce2ff454?cid=a85209896e5c4fd49785f50de4e6fd07","3DkCCtmKMPoUAy1hdho5bZ","ab67616d0000b273e982f31d9731525721152ccd"],
["Шум","Tommi","Engineer · Mastering · Mixing","2023","3a53631108b9c184021b7e505879f33e50a89c68","45zyuuOz98Pn486eOCGm3Y","ab67616d0000b27328aef4fd735fbe1824d4b5b7"],
["стены","Cash Doll","Mastering · Mixing","2023","f222d2da206c28add04f3a5666976826e9fa05ae","2o2Ss6x3h4DkLkvWxJxhTj","ab67616d0000b27343acb9cceedde0fc97922927"],
["MY RAP/YOUR RAP","Lex McQueen","Mixing · Mastering · Engineer","2023","94c81a066a007702acd8c8d52a3688631d78a8a2","5F4RDuKvTSTBkFhaBFEQ6h","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Живой и спасибо","LATEONDATE","Mixing · Mastering","2024","8277a9e85aa00ebae4ed434341fec8e9efbefdee","2FgLJSxpbzYm831ARWRXDr","ab67616d0000b273869a017ecd108a8472a71797"],
["QUEEN","COPIS STORM","Mixing · Mastering · Engineer","2023","f3878a01a530ddfb349a737bb874c562539752eb?cid=a8476ea976194ba48d8997ac2dc9cf16","5BZYdPUUSbqlsUAIJ8glNE","ab67616d0000b273e982f31d9731525721152ccd"],
["июль","Cash Doll","Mixing · Mastering","2023","6beb03dbd90c116e36519780656ae5430a195c39","3XuW0FarQAhSLv3f6ebgA8","ab67616d0000b27343acb9cceedde0fc97922927"],
["Відболіло","VYSOTSKAYA","Mastering · Mixing","2023","e6e334d4ed8eb3e0398c0b05f5a969749b80a534","09ktATxSDKgCEF5nGe1KRa","ab67616d0000b273703d448148238f8dfca74086"],
["NEW DAY WITH OLD THOUGHTS","Lex McQueen","Mixing · Mastering · Engineer","2023","f6eb0ef4faf6bcb472a01d3653ca67d6a96c33a6","3GYucGhzReTOPgVdS4aMC4","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["1000 лезвий","Zetsu","Engineer · Mastering · Mixing","2023","0c31f76fc4cbb0cdb0263d4e622c243ab2b4e914","5aRsNthXwYEmTlHEnmEv9T","ab67616d0000b2735ef00a9083c002d3c465b93c"],
["INTER","Lex McQueen","Mixing · Mastering · Engineer","2023","152246d2829508bb063088a72f23512409a07f00?cid=1166a370b3c34e7a8469399db9f1abe2","19HT6fWqUBXJAiFT7UG5rF","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Тост","Niko Baro","Mastering","2021","19e2e4bd62eb58316c98100a4803403a91e90d5d","6epPMBG9vGnj8j3YTBgmNc","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["жаль, что я не Англия","Cash Doll","Mixing · Mastering","2023","6f56f9bce948bce98577ae5972028abff2886bbf?cid=c73adf9694b143deb4c357781bb23b49","0M1yc6SKiwxRreNTTOn2nt","ab67616d0000b27343acb9cceedde0fc97922927"],
["UKRСЕРЦЕ","Zakharova, Tony Millnor& MSTPD","Producer","2022","bde7278bceffd5b9ee1ef4f5877a0b515196d201","4rPdy59kfzeSOpmxklPOl2","ab67616d0000b2734ec3634952a884d366d1eb00"],
["Low Life","Niko Baro, TRISHA","Mastering","2021","1854bc1d086b0732d7735781ead2bdf2a0c96e9d","4XSUQ3CJfGdHJl9uzYieHE","ab67616d0000b273878e5471efef6482bef0d34e"],
["Жажда","Zetsu","Engineer · Mastering · Mixing","2023","cf1c0a88a6f740f40746d1779cddbc229b396a03","0Rf9wuTgM4C67kBzXnixMy","ab67616d0000b2735ef00a9083c002d3c465b93c"],
["Not That One","Masha 18","Mastering · Mixing · Engineer","2022","fad56244131eb671860259055808cd7d7ba0cf9b?cid=fdaf0c5afb3e48d69f882ce6b671e0bc","70r1qtTJaEoh3bDDq4JjYf","ab67616d0000b273217b6d2f43b7ed737819c3e3"],
["Сон (Prod. by VHQ)","Niko Baro","Mastering","2021","0f35b50de552ff5847e6185a1f17bc5c4923a839","5FxWEEpkhnvrXoVWfYccWG","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["DUBAI","COPIS STORM","Mastering · Mixing · Engineer","2023","","58lMRG6rh6rj6ZJJNpBpKn","ab67616d0000b273e982f31d9731525721152ccd"],
["Огни","Diessy","Mastering","2025","ce0b03042f3bbfb7fbddafe65b223ee49b8eca39","1HhgJNfJcFKooDvKYLaTN0","ab67616d0000b273867203ceeea7983074361547"],
["BIG BALANCE","COPIS STORM","Mastering · Mixing · Engineer","2023","c2b514bcd4e79df92760ea1fcd423f54f8c467c0?cid=31d3311c37744655add44953feef725e","4oaNuc1noLIoxhFU6WWT9Q","ab67616d0000b273e982f31d9731525721152ccd"],
["КАК ХОЧУ","COPIS STORM","Mixing · Engineer · Mastering","2023","77468425f61830157c2e038c5391f63a7cfcc392?cid=e74cc6275e2649cf94112c7ab3cff724","6PLox04XABw0aDrBxoWMAg","ab67616d0000b273e982f31d9731525721152ccd"],
["AMELIA INTRO","COPIS STORM","Engineer · Mastering · Mixing","2023","cc5e93ffb8d65e4e9b1ea9f2a3fb2cd979955b69?cid=3f90a4900ef848e8915e2b31181d4e7e","5bvJmlGQ56qs9WbGiVQRsh","ab67616d0000b273e982f31d9731525721152ccd"],
["Вечность","TRISHA","Mixing · Engineer · Mastering","2021","a000c87fa9f0cc1f66bcf2c9730cdf9b0e23cdea","4159IK82fyo4G5fwaoKsRS","ab67616d0000b2739c28d5da68eaf8ebeb010311"],
["100 (Prod. by VHQ)","Niko Baro","Mastering","2021","077e4659568118219ef527e6492f277aeddcec3a","5YN4UngAzvUjQpZ8ykvGcC","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["SSH","Lex McQueen","Mixing · Mastering · Engineer","2023","dadbaa5c47f6c40b6d7cd86a8113b80e6054b4f3","51ULQTbZDMOliauTnDQisx","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Псевдоінфа","KRIVDA","Mastering · Mixing","2025","","","https://resources.tidal.com/images/a225c83b/58ca/4c66/8577/f2e5e42c1494/640x640.jpg"],
["Тридцять Три Патрона","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","3997887cafac2014465d4bdbf908f6b100205f8e","018UREt590NzVEyuUFHlf6","ab67616d0000b2739a496170c1ce46ab34358608"],
["WANNA YOU","COPIS STORM","Mixing · Engineer · Mastering","2022","cbcbb00879fff9a25e4ba0f22b02e46be107d788?cid=c79eb534c21e41b28dc8cc8f4164d01f","68Py1LWGCPReJnHl1jexC1","ab67616d0000b27320476c147a3a1dfd0a9ddf16"],
["Кроме денег","Niko Baro, Gurme","Mastering","2021","6534deb2d3da8b726deb66193a2c709a4b0bebf8","6maXIg1sQNIiARLIWsxfAl","ab67616d0000b273878e5471efef6482bef0d34e"],
["Big Boy","Katala","Producer","2019","43311f47fa0366d2b6961e925f521a078dafb4a5?cid=2c3642b3bc9a43dd861c708d166e7cce","6JeMQsqHRvvvo7LVGviaZ4","ab67616d0000b27367de1f088db72a9d1883489d"],
["Нібито Uzi","BLESS BOI KANA","Engineer · Mastering · Mixing","2023","00061db2e7a50026e006664463fc26bff5353646","7D8vILrPGzR8o1IgteCCFq","ab67616d0000b2739a496170c1ce46ab34358608"],
["Chaos (Prod. by VHQ)","Niko Baro","Mastering","2021","355479932d18a3f12b1eec02807b9ed47eda07f3","4nWj5pOh3KMyzp8T49aLb9","ab67616d0000b2730c602f4d709cdf9b59cb5916"],
["WHAT ABOUT ME?","Lex McQueen","Mastering · Mixing · Engineer","2023","b1c916de64915b09bb447b28d7fa0847d00c8e2a","5DyaVjHyHI88lmIhkVYJFE","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["Thats we","Niko Baro","Mastering","2021","f2a9d2e55206ae54b6d3775839d62784ced2db4c","6fNRiNkdm3SaD0GZvfnF5q","ab67616d0000b273878e5471efef6482bef0d34e"],
["THANKFUL","Lex McQueen","Mastering · Engineer · Mixing","2023","9937f13f8a17fa057f24ccee3b71e5bd71b238db","69Yz9XPNJVo7GrCYWpku3H","ab67616d0000b2734fcbac33f0f973db7e556bf5"],
["PUSSY","COPIS STORM","Mixing · Engineer · Mastering","2023","c35b24219f0ebef4f8965dc7166abf9b659ee892?cid=59d8d6f2651946ef9d0c788730ac787e","2EqIBGTKhTXfbfX3YJCDXA","ab67616d0000b273e982f31d9731525721152ccd"],
["Zaplyushch meni ochi","BLAZENB, GLAVNAYA","Mixing · Mastering · Engineer","2023","e8f3de08edb0bb20d4e08a7be8fae7fd6f0f3b6e","3BQfCY3HLQUZ3dD9XVzcBN","ab67616d0000b2736af1626cfd2aa7ea32cf892e"],
["За бортом","AVAQ","Mastering · Mixing","2025","f0dde595f86facc1222de8e047a4dfa886aed2f4","50suG2JgVetKPwMXRpYHs7","ab67616d0000b27343b40a0cf6603b8fbfc93d67"],
["Было и прошло","TRISHA","Mastering · Mixing · Engineer","2021","5f724ecd1541b3d16bb8cf003681a40bdd6a094e?cid=752eafadc9ab4b6fbabe14876fb3bd3b","1YYiG4Lk2e9mcdWdAK4ENj","ab67616d0000b2739c28d5da68eaf8ebeb010311"],
["Parasites","Brogues","Engineer · Mastering · Mixing","2020","c0ff5814546367046c709c8049644ddc114d55ce?cid=bfbf6d119a5447f7b1195710d3a1eb7c","4ljrt0vdXocNycSXjvxijB","ab67616d0000b27372355ab4927501213d66b003"]];

  const rowsWrap = document.getElementById('rows');
  const toggle = document.getElementById('rowsToggle');
  if (!rowsWrap || !toggle) return;

  const CDN_P = 'https://p.scdn.co/mp3-preview/';
  const CDN_I = 'https://i.scdn.co/image/';
  const SPOTIFY = 'https://open.spotify.com/track/';
  const abs = (v, base) => v.includes('://') ? v : base + v;

  const PLAY_ICONS =
    '<svg class="ico-play" viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg>' +
    '<svg class="ico-pause" viewBox="0 0 12 14" aria-hidden="true"><rect x="0" y="0" width="4" height="14"/><rect x="8" y="0" width="4" height="14"/></svg>';

  const frag = document.createDocumentFragment();
  DATA.forEach(([title, artists, roles, year, preview, spotify, art], k) => {
    const row = document.createElement('div');
    row.className = 'row reveal is-extra';
    if (preview) {
      row.setAttribute('data-player', '');
      row.dataset.src = abs(preview, CDN_P);
    }
    if (art) row.dataset.img = abs(art, CDN_I);
    row.dataset.genre = '';                 // unverified: shows under "All" only

    const idx = document.createElement('span');
    idx.className = 'row__idx';
    idx.textContent = String(31 + k);

    const btn = document.createElement('button');
    btn.className = 'row__btn';
    btn.type = 'button';
    btn.innerHTML = PLAY_ICONS;             // static markup, no user data
    if (preview) {
      btn.setAttribute('aria-label', 'Play ' + title + ' by ' + artists);
    } else {
      btn.disabled = true;
      btn.setAttribute('aria-hidden', 'true');
      btn.tabIndex = -1;
    }

    const mk = (cls, text) => {
      const el = document.createElement('span');
      el.className = cls;
      el.textContent = text;
      return el;
    };

    let out;
    if (spotify) {
      out = document.createElement('a');
      out.className = 'row__out';
      out.href = SPOTIFY + spotify;
      out.target = '_blank';
      out.rel = 'noopener noreferrer';
      out.setAttribute('aria-label', 'Open ' + title + ' on Spotify');
      out.textContent = '↗';
    } else {
      out = mk('row__out', '');
      out.setAttribute('aria-hidden', 'true');
    }

    const bar = document.createElement('span');
    bar.className = 'row__bar';
    bar.setAttribute('data-bar', '');
    bar.setAttribute('aria-hidden', 'true');

    row.append(idx, btn, mk('row__artist', artists), mk('row__track', title),
               mk('row__role', roles), mk('row__year', year), out, bar);
    frag.append(row);
  });
  rowsWrap.append(frag);

  /* show-all toggle. Label refreshes on language switch too — i18n.js
     announces changes via a 'langchange' event on the document. */
  const t = (key, fallback) => (window.T ? window.T(key, fallback) : fallback);
  const setLabel = () => {
    const open = rowsWrap.classList.contains('is-open');
    const span = toggle.querySelector('span');
    span.textContent = open
      ? t('cred.show_less', 'Show top 30 only')
      : t('cred.show_all', 'Show all 265');
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => {
    rowsWrap.classList.toggle('is-open');
    setLabel();
    // collapsing from deep in the list would strand the viewport
    if (!rowsWrap.classList.contains('is-open')) {
      rowsWrap.closest('section').scrollIntoView({ block: 'start' });
    }
  });
  document.addEventListener('langchange', setLabel);
  setLabel();
})();
