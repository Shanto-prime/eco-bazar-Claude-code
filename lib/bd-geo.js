// lib/bd-geo.js
// Bangladesh administrative hierarchy: Division (বিভাগ) -> District/Jella (জেলা)
// -> Thana/Upazila (থানা/উপজেলা). Used by the checkout address selector for the
// cascading Division -> District -> Thana dropdowns.
//
// Source: nuhil/bangladesh-geocode (bd_geo_code) - 8 divisions, 64 districts,
// 495 upazilas. English `name` is the stored/canonical value; `bn` is the
// Bengali label shown alongside it. Data is sorted alphabetically by English
// name at every level. Regenerated data only - edit the generator, not by hand.

export const BD_DIVISIONS = [
  {
    "name": "Barisal",
    "bn": "বরিশাল",
    "districts": [
      {
        "name": "Barguna",
        "bn": "বরগুনা",
        "thanas": [
          {
            "name": "Amtali",
            "bn": "আমতলী"
          },
          {
            "name": "Bamna",
            "bn": "বামনা"
          },
          {
            "name": "Barguna Sadar",
            "bn": "বরগুনা সদর"
          },
          {
            "name": "Betagi",
            "bn": "বেতাগী"
          },
          {
            "name": "Pathorghata",
            "bn": "পাথরঘাটা"
          },
          {
            "name": "Taltali",
            "bn": "তালতলি"
          }
        ]
      },
      {
        "name": "Barisal",
        "bn": "বরিশাল",
        "thanas": [
          {
            "name": "Agailjhara",
            "bn": "আগৈলঝাড়া"
          },
          {
            "name": "Babuganj",
            "bn": "বাবুগঞ্জ"
          },
          {
            "name": "Bakerganj",
            "bn": "বাকেরগঞ্জ"
          },
          {
            "name": "Banaripara",
            "bn": "বানারীপাড়া"
          },
          {
            "name": "Barisal Sadar",
            "bn": "বরিশাল সদর"
          },
          {
            "name": "Gournadi",
            "bn": "গৌরনদী"
          },
          {
            "name": "Hizla",
            "bn": "হিজলা"
          },
          {
            "name": "Mehendiganj",
            "bn": "মেহেন্দিগঞ্জ"
          },
          {
            "name": "Muladi",
            "bn": "মুলাদী"
          },
          {
            "name": "Wazirpur",
            "bn": "উজিরপুর"
          }
        ]
      },
      {
        "name": "Bhola",
        "bn": "ভোলা",
        "thanas": [
          {
            "name": "Bhola Sadar",
            "bn": "ভোলা সদর"
          },
          {
            "name": "Borhan Sddin",
            "bn": "বোরহান উদ্দিন"
          },
          {
            "name": "Charfesson",
            "bn": "চরফ্যাশন"
          },
          {
            "name": "Doulatkhan",
            "bn": "দৌলতখান"
          },
          {
            "name": "Lalmohan",
            "bn": "লালমোহন"
          },
          {
            "name": "Monpura",
            "bn": "মনপুরা"
          },
          {
            "name": "Tazumuddin",
            "bn": "তজুমদ্দিন"
          }
        ]
      },
      {
        "name": "Jhalakathi",
        "bn": "ঝালকাঠি",
        "thanas": [
          {
            "name": "Jhalakathi Sadar",
            "bn": "ঝালকাঠি সদর"
          },
          {
            "name": "Kathalia",
            "bn": "কাঠালিয়া"
          },
          {
            "name": "Nalchity",
            "bn": "নলছিটি"
          },
          {
            "name": "Rajapur",
            "bn": "রাজাপুর"
          }
        ]
      },
      {
        "name": "Patuakhali",
        "bn": "পটুয়াখালী",
        "thanas": [
          {
            "name": "Bauphal",
            "bn": "বাউফল"
          },
          {
            "name": "Dashmina",
            "bn": "দশমিনা"
          },
          {
            "name": "Dumki",
            "bn": "দুমকি"
          },
          {
            "name": "Galachipa",
            "bn": "গলাচিপা"
          },
          {
            "name": "Kalapara",
            "bn": "কলাপাড়া"
          },
          {
            "name": "Mirzaganj",
            "bn": "মির্জাগঞ্জ"
          },
          {
            "name": "Patuakhali Sadar",
            "bn": "পটুয়াখালী সদর"
          },
          {
            "name": "Rangabali",
            "bn": "রাঙ্গাবালী"
          }
        ]
      },
      {
        "name": "Pirojpur",
        "bn": "পিরোজপুর",
        "thanas": [
          {
            "name": "Bhandaria",
            "bn": "ভান্ডারিয়া"
          },
          {
            "name": "Kawkhali",
            "bn": "কাউখালী"
          },
          {
            "name": "Mathbaria",
            "bn": "মঠবাড়ীয়া"
          },
          {
            "name": "Nazirpur",
            "bn": "নাজিরপুর"
          },
          {
            "name": "Nesarabad",
            "bn": "নেছারাবাদ"
          },
          {
            "name": "Pirojpur Sadar",
            "bn": "পিরোজপুর সদর"
          },
          {
            "name": "Zianagar",
            "bn": "জিয়ানগর"
          }
        ]
      }
    ]
  },
  {
    "name": "Chattagram",
    "bn": "চট্টগ্রাম",
    "districts": [
      {
        "name": "Bandarban",
        "bn": "বান্দরবান",
        "thanas": [
          {
            "name": "Alikadam",
            "bn": "আলীকদম"
          },
          {
            "name": "Bandarban Sadar",
            "bn": "বান্দরবান সদর"
          },
          {
            "name": "Lama",
            "bn": "লামা"
          },
          {
            "name": "Naikhongchhari",
            "bn": "নাইক্ষ্যংছড়ি"
          },
          {
            "name": "Rowangchhari",
            "bn": "রোয়াংছড়ি"
          },
          {
            "name": "Ruma",
            "bn": "রুমা"
          },
          {
            "name": "Thanchi",
            "bn": "থানচি"
          }
        ]
      },
      {
        "name": "Brahmanbaria",
        "bn": "ব্রাহ্মণবাড়িয়া",
        "thanas": [
          {
            "name": "Akhaura",
            "bn": "আখাউড়া"
          },
          {
            "name": "Ashuganj",
            "bn": "আশুগঞ্জ"
          },
          {
            "name": "Bancharampur",
            "bn": "বাঞ্ছারামপুর"
          },
          {
            "name": "Bijoynagar",
            "bn": "বিজয়নগর"
          },
          {
            "name": "Brahmanbaria Sadar",
            "bn": "ব্রাহ্মণবাড়িয়া সদর"
          },
          {
            "name": "Kasba",
            "bn": "কসবা"
          },
          {
            "name": "Nabinagar",
            "bn": "নবীনগর"
          },
          {
            "name": "Nasirnagar",
            "bn": "নাসিরনগর"
          },
          {
            "name": "Sarail",
            "bn": "সরাইল"
          }
        ]
      },
      {
        "name": "Chandpur",
        "bn": "চাঁদপুর",
        "thanas": [
          {
            "name": "Chandpur Sadar",
            "bn": "চাঁদপুর সদর"
          },
          {
            "name": "Faridgonj",
            "bn": "ফরিদগঞ্জ"
          },
          {
            "name": "Haimchar",
            "bn": "হাইমচর"
          },
          {
            "name": "Hajiganj",
            "bn": "হাজীগঞ্জ"
          },
          {
            "name": "Kachua",
            "bn": "কচুয়া"
          },
          {
            "name": "Matlab North",
            "bn": "মতলব উত্তর"
          },
          {
            "name": "Matlab South",
            "bn": "মতলব দক্ষিণ"
          },
          {
            "name": "Shahrasti",
            "bn": "শাহরাস্তি\t"
          }
        ]
      },
      {
        "name": "Chattogram",
        "bn": "চট্টগ্রাম",
        "thanas": [
          {
            "name": "Anwara",
            "bn": "আনোয়ারা"
          },
          {
            "name": "Banshkhali",
            "bn": "বাঁশখালী"
          },
          {
            "name": "Boalkhali",
            "bn": "বোয়ালখালী"
          },
          {
            "name": "Chandanaish",
            "bn": "চন্দনাইশ"
          },
          {
            "name": "Fatikchhari",
            "bn": "ফটিকছড়ি"
          },
          {
            "name": "Hathazari",
            "bn": "হাটহাজারী"
          },
          {
            "name": "Karnafuli",
            "bn": "কর্ণফুলী"
          },
          {
            "name": "Lohagara",
            "bn": "লোহাগাড়া"
          },
          {
            "name": "Mirsharai",
            "bn": "মীরসরাই"
          },
          {
            "name": "Patiya",
            "bn": "পটিয়া"
          },
          {
            "name": "Rangunia",
            "bn": "রাঙ্গুনিয়া"
          },
          {
            "name": "Raozan",
            "bn": "রাউজান"
          },
          {
            "name": "Sandwip",
            "bn": "সন্দ্বীপ"
          },
          {
            "name": "Satkania",
            "bn": "সাতকানিয়া"
          },
          {
            "name": "Sitakunda",
            "bn": "সীতাকুন্ড"
          }
        ]
      },
      {
        "name": "Comilla",
        "bn": "কুমিল্লা",
        "thanas": [
          {
            "name": "Barura",
            "bn": "বরুড়া"
          },
          {
            "name": "Brahmanpara",
            "bn": "ব্রাহ্মণপাড়া"
          },
          {
            "name": "Burichang",
            "bn": "বুড়িচং"
          },
          {
            "name": "Chandina",
            "bn": "চান্দিনা"
          },
          {
            "name": "Chauddagram",
            "bn": "চৌদ্দগ্রাম"
          },
          {
            "name": "Comilla Sadar",
            "bn": "কুমিল্লা সদর"
          },
          {
            "name": "Daudkandi",
            "bn": "দাউদকান্দি"
          },
          {
            "name": "Debidwar",
            "bn": "দেবিদ্বার"
          },
          {
            "name": "Homna",
            "bn": "হোমনা"
          },
          {
            "name": "Laksam",
            "bn": "লাকসাম"
          },
          {
            "name": "Lalmai",
            "bn": "লালমাই"
          },
          {
            "name": "Meghna",
            "bn": "মেঘনা"
          },
          {
            "name": "Monohargonj",
            "bn": "মনোহরগঞ্জ"
          },
          {
            "name": "Muradnagar",
            "bn": "মুরাদনগর"
          },
          {
            "name": "Nangalkot",
            "bn": "নাঙ্গলকোট"
          },
          {
            "name": "Sadarsouth",
            "bn": "সদর দক্ষিণ"
          },
          {
            "name": "Titas",
            "bn": "তিতাস"
          }
        ]
      },
      {
        "name": "Coxsbazar",
        "bn": "কক্সবাজার",
        "thanas": [
          {
            "name": "Chakaria",
            "bn": "চকরিয়া"
          },
          {
            "name": "Coxsbazar Sadar",
            "bn": "কক্সবাজার সদর"
          },
          {
            "name": "Eidgaon",
            "bn": "ঈদগাঁও"
          },
          {
            "name": "Kutubdia",
            "bn": "কুতুবদিয়া"
          },
          {
            "name": "Moheshkhali",
            "bn": "মহেশখালী"
          },
          {
            "name": "Pekua",
            "bn": "পেকুয়া"
          },
          {
            "name": "Ramu",
            "bn": "রামু"
          },
          {
            "name": "Teknaf",
            "bn": "টেকনাফ"
          },
          {
            "name": "Ukhiya",
            "bn": "উখিয়া"
          }
        ]
      },
      {
        "name": "Feni",
        "bn": "ফেনী",
        "thanas": [
          {
            "name": "Chhagalnaiya",
            "bn": "ছাগলনাইয়া"
          },
          {
            "name": "Daganbhuiyan",
            "bn": "দাগনভূঞা"
          },
          {
            "name": "Feni Sadar",
            "bn": "ফেনী সদর"
          },
          {
            "name": "Fulgazi",
            "bn": "ফুলগাজী"
          },
          {
            "name": "Parshuram",
            "bn": "পরশুরাম"
          },
          {
            "name": "Sonagazi",
            "bn": "সোনাগাজী"
          }
        ]
      },
      {
        "name": "Khagrachhari",
        "bn": "খাগড়াছড়ি",
        "thanas": [
          {
            "name": "Dighinala",
            "bn": "দিঘীনালা"
          },
          {
            "name": "Guimara",
            "bn": "গুইমারা"
          },
          {
            "name": "Khagrachhari Sadar",
            "bn": "খাগড়াছড়ি সদর"
          },
          {
            "name": "Laxmichhari",
            "bn": "লক্ষীছড়ি"
          },
          {
            "name": "Manikchari",
            "bn": "মানিকছড়ি"
          },
          {
            "name": "Matiranga",
            "bn": "মাটিরাঙ্গা"
          },
          {
            "name": "Mohalchari",
            "bn": "মহালছড়ি"
          },
          {
            "name": "Panchari",
            "bn": "পানছড়ি"
          },
          {
            "name": "Ramgarh",
            "bn": "রামগড়"
          }
        ]
      },
      {
        "name": "Lakshmipur",
        "bn": "লক্ষ্মীপুর",
        "thanas": [
          {
            "name": "Kamalnagar",
            "bn": "কমলনগর"
          },
          {
            "name": "Lakshmipur Sadar",
            "bn": "লক্ষ্মীপুর সদর"
          },
          {
            "name": "Raipur",
            "bn": "রায়পুর"
          },
          {
            "name": "Ramganj",
            "bn": "রামগঞ্জ"
          },
          {
            "name": "Ramgati",
            "bn": "রামগতি"
          }
        ]
      },
      {
        "name": "Noakhali",
        "bn": "নোয়াখালী",
        "thanas": [
          {
            "name": "Begumganj",
            "bn": "বেগমগঞ্জ"
          },
          {
            "name": "Chatkhil",
            "bn": "চাটখিল"
          },
          {
            "name": "Companiganj",
            "bn": "কোম্পানীগঞ্জ"
          },
          {
            "name": "Hatia",
            "bn": "হাতিয়া"
          },
          {
            "name": "Kabirhat",
            "bn": "কবিরহাট"
          },
          {
            "name": "Noakhali Sadar",
            "bn": "নোয়াখালী সদর"
          },
          {
            "name": "Senbug",
            "bn": "সেনবাগ"
          },
          {
            "name": "Sonaimori",
            "bn": "সোনাইমুড়ী"
          },
          {
            "name": "Subarnachar",
            "bn": "সুবর্ণচর"
          }
        ]
      },
      {
        "name": "Rangamati",
        "bn": "রাঙ্গামাটি",
        "thanas": [
          {
            "name": "Baghaichari",
            "bn": "বাঘাইছড়ি"
          },
          {
            "name": "Barkal",
            "bn": "বরকল"
          },
          {
            "name": "Belaichari",
            "bn": "বিলাইছড়ি"
          },
          {
            "name": "Juraichari",
            "bn": "জুরাছড়ি"
          },
          {
            "name": "Kaptai",
            "bn": "কাপ্তাই"
          },
          {
            "name": "Kawkhali",
            "bn": "কাউখালী"
          },
          {
            "name": "Langadu",
            "bn": "লংগদু"
          },
          {
            "name": "Naniarchar",
            "bn": "নানিয়ারচর"
          },
          {
            "name": "Rajasthali",
            "bn": "রাজস্থলী"
          },
          {
            "name": "Rangamati Sadar",
            "bn": "রাঙ্গামাটি সদর"
          }
        ]
      }
    ]
  },
  {
    "name": "Dhaka",
    "bn": "ঢাকা",
    "districts": [
      {
        "name": "Dhaka",
        "bn": "ঢাকা",
        "thanas": [
          {
            "name": "Dhamrai",
            "bn": "ধামরাই"
          },
          {
            "name": "Dohar",
            "bn": "দোহার"
          },
          {
            "name": "Keraniganj",
            "bn": "কেরাণীগঞ্জ"
          },
          {
            "name": "Nawabganj",
            "bn": "নবাবগঞ্জ"
          },
          {
            "name": "Savar",
            "bn": "সাভার"
          }
        ]
      },
      {
        "name": "Faridpur",
        "bn": "ফরিদপুর",
        "thanas": [
          {
            "name": "Alfadanga",
            "bn": "আলফাডাঙ্গা"
          },
          {
            "name": "Bhanga",
            "bn": "ভাঙ্গা"
          },
          {
            "name": "Boalmari",
            "bn": "বোয়ালমারী"
          },
          {
            "name": "Charbhadrasan",
            "bn": "চরভদ্রাসন"
          },
          {
            "name": "Faridpur Sadar",
            "bn": "ফরিদপুর সদর"
          },
          {
            "name": "Madhukhali",
            "bn": "মধুখালী"
          },
          {
            "name": "Nagarkanda",
            "bn": "নগরকান্দা"
          },
          {
            "name": "Sadarpur",
            "bn": "সদরপুর"
          },
          {
            "name": "Saltha",
            "bn": "সালথা"
          }
        ]
      },
      {
        "name": "Gazipur",
        "bn": "গাজীপুর",
        "thanas": [
          {
            "name": "Gazipur Sadar",
            "bn": "গাজীপুর সদর"
          },
          {
            "name": "Kaliakair",
            "bn": "কালিয়াকৈর"
          },
          {
            "name": "Kaliganj",
            "bn": "কালীগঞ্জ"
          },
          {
            "name": "Kapasia",
            "bn": "কাপাসিয়া"
          },
          {
            "name": "Sreepur",
            "bn": "শ্রীপুর"
          }
        ]
      },
      {
        "name": "Gopalganj",
        "bn": "গোপালগঞ্জ",
        "thanas": [
          {
            "name": "Gopalganj Sadar",
            "bn": "গোপালগঞ্জ সদর"
          },
          {
            "name": "Kashiani",
            "bn": "কাশিয়ানী"
          },
          {
            "name": "Kotalipara",
            "bn": "কোটালীপাড়া"
          },
          {
            "name": "Muksudpur",
            "bn": "মুকসুদপুর"
          },
          {
            "name": "Tungipara",
            "bn": "টুংগীপাড়া"
          }
        ]
      },
      {
        "name": "Kishoreganj",
        "bn": "কিশোরগঞ্জ",
        "thanas": [
          {
            "name": "Austagram",
            "bn": "অষ্টগ্রাম"
          },
          {
            "name": "Bajitpur",
            "bn": "বাজিতপুর"
          },
          {
            "name": "Bhairab",
            "bn": "ভৈরব"
          },
          {
            "name": "Hossainpur",
            "bn": "হোসেনপুর"
          },
          {
            "name": "Itna",
            "bn": "ইটনা"
          },
          {
            "name": "Karimgonj",
            "bn": "করিমগঞ্জ"
          },
          {
            "name": "Katiadi",
            "bn": "কটিয়াদী"
          },
          {
            "name": "Kishoreganj Sadar",
            "bn": "কিশোরগঞ্জ সদর"
          },
          {
            "name": "Kuliarchar",
            "bn": "কুলিয়ারচর"
          },
          {
            "name": "Mithamoin",
            "bn": "মিঠামইন"
          },
          {
            "name": "Nikli",
            "bn": "নিকলী"
          },
          {
            "name": "Pakundia",
            "bn": "পাকুন্দিয়া"
          },
          {
            "name": "Tarail",
            "bn": "তাড়াইল"
          }
        ]
      },
      {
        "name": "Madaripur",
        "bn": "মাদারীপুর",
        "thanas": [
          {
            "name": "Dasar",
            "bn": "ডাসার"
          },
          {
            "name": "Kalkini",
            "bn": "কালকিনি"
          },
          {
            "name": "Madaripur Sadar",
            "bn": "মাদারীপুর সদর"
          },
          {
            "name": "Rajoir",
            "bn": "রাজৈর"
          },
          {
            "name": "Shibchar",
            "bn": "শিবচর"
          }
        ]
      },
      {
        "name": "Manikganj",
        "bn": "মানিকগঞ্জ",
        "thanas": [
          {
            "name": "Doulatpur",
            "bn": "দৌলতপুর"
          },
          {
            "name": "Gior",
            "bn": "ঘিওর"
          },
          {
            "name": "Harirampur",
            "bn": "হরিরামপুর"
          },
          {
            "name": "Manikganj Sadar",
            "bn": "মানিকগঞ্জ সদর"
          },
          {
            "name": "Saturia",
            "bn": "সাটুরিয়া"
          },
          {
            "name": "Shibaloy",
            "bn": "শিবালয়"
          },
          {
            "name": "Singiar",
            "bn": "সিংগাইর"
          }
        ]
      },
      {
        "name": "Munshiganj",
        "bn": "মুন্সিগঞ্জ",
        "thanas": [
          {
            "name": "Gajaria",
            "bn": "গজারিয়া"
          },
          {
            "name": "Louhajanj",
            "bn": "লৌহজং"
          },
          {
            "name": "Munshiganj Sadar",
            "bn": "মুন্সিগঞ্জ সদর"
          },
          {
            "name": "Sirajdikhan",
            "bn": "সিরাজদিখান"
          },
          {
            "name": "Sreenagar",
            "bn": "শ্রীনগর"
          },
          {
            "name": "Tongibari",
            "bn": "টংগীবাড়ি"
          }
        ]
      },
      {
        "name": "Narayanganj",
        "bn": "নারায়ণগঞ্জ",
        "thanas": [
          {
            "name": "Araihazar",
            "bn": "আড়াইহাজার"
          },
          {
            "name": "Bandar",
            "bn": "বন্দর"
          },
          {
            "name": "Narayanganj Sadar",
            "bn": "নারায়নগঞ্জ সদর"
          },
          {
            "name": "Rupganj",
            "bn": "রূপগঞ্জ"
          },
          {
            "name": "Sonargaon",
            "bn": "সোনারগাঁ"
          }
        ]
      },
      {
        "name": "Narsingdi",
        "bn": "নরসিংদী",
        "thanas": [
          {
            "name": "Belabo",
            "bn": "বেলাবো"
          },
          {
            "name": "Monohardi",
            "bn": "মনোহরদী"
          },
          {
            "name": "Narsingdi Sadar",
            "bn": "নরসিংদী সদর"
          },
          {
            "name": "Palash",
            "bn": "পলাশ"
          },
          {
            "name": "Raipura",
            "bn": "রায়পুরা"
          },
          {
            "name": "Shibpur",
            "bn": "শিবপুর"
          }
        ]
      },
      {
        "name": "Rajbari",
        "bn": "রাজবাড়ী",
        "thanas": [
          {
            "name": "Baliakandi",
            "bn": "বালিয়াকান্দি"
          },
          {
            "name": "Goalanda",
            "bn": "গোয়ালন্দ"
          },
          {
            "name": "Kalukhali",
            "bn": "কালুখালী"
          },
          {
            "name": "Pangsa",
            "bn": "পাংশা"
          },
          {
            "name": "Rajbari Sadar",
            "bn": "রাজবাড়ী সদর"
          }
        ]
      },
      {
        "name": "Shariatpur",
        "bn": "শরীয়তপুর",
        "thanas": [
          {
            "name": "Bhedarganj",
            "bn": "ভেদরগঞ্জ"
          },
          {
            "name": "Damudya",
            "bn": "ডামুড্যা"
          },
          {
            "name": "Gosairhat",
            "bn": "গোসাইরহাট"
          },
          {
            "name": "Naria",
            "bn": "নড়িয়া"
          },
          {
            "name": "Shariatpur Sadar",
            "bn": "শরিয়তপুর সদর"
          },
          {
            "name": "Zajira",
            "bn": "জাজিরা"
          }
        ]
      },
      {
        "name": "Tangail",
        "bn": "টাঙ্গাইল",
        "thanas": [
          {
            "name": "Basail",
            "bn": "বাসাইল"
          },
          {
            "name": "Bhuapur",
            "bn": "ভুয়াপুর"
          },
          {
            "name": "Delduar",
            "bn": "দেলদুয়ার"
          },
          {
            "name": "Dhanbari",
            "bn": "ধনবাড়ী"
          },
          {
            "name": "Ghatail",
            "bn": "ঘাটাইল"
          },
          {
            "name": "Gopalpur",
            "bn": "গোপালপুর"
          },
          {
            "name": "Kalihati",
            "bn": "কালিহাতী"
          },
          {
            "name": "Madhupur",
            "bn": "মধুপুর"
          },
          {
            "name": "Mirzapur",
            "bn": "মির্জাপুর"
          },
          {
            "name": "Nagarpur",
            "bn": "নাগরপুর"
          },
          {
            "name": "Sakhipur",
            "bn": "সখিপুর"
          },
          {
            "name": "Tangail Sadar",
            "bn": "টাঙ্গাইল সদর"
          }
        ]
      }
    ]
  },
  {
    "name": "Khulna",
    "bn": "খুলনা",
    "districts": [
      {
        "name": "Bagerhat",
        "bn": "বাগেরহাট",
        "thanas": [
          {
            "name": "Bagerhat Sadar",
            "bn": "বাগেরহাট সদর"
          },
          {
            "name": "Chitalmari",
            "bn": "চিতলমারী"
          },
          {
            "name": "Fakirhat",
            "bn": "ফকিরহাট"
          },
          {
            "name": "Kachua",
            "bn": "কচুয়া"
          },
          {
            "name": "Mollahat",
            "bn": "মোল্লাহাট"
          },
          {
            "name": "Mongla",
            "bn": "মোংলা"
          },
          {
            "name": "Morrelganj",
            "bn": "মোড়েলগঞ্জ"
          },
          {
            "name": "Rampal",
            "bn": "রামপাল"
          },
          {
            "name": "Sarankhola",
            "bn": "শরণখোলা"
          }
        ]
      },
      {
        "name": "Chuadanga",
        "bn": "চুয়াডাঙ্গা",
        "thanas": [
          {
            "name": "Alamdanga",
            "bn": "আলমডাঙ্গা"
          },
          {
            "name": "Chuadanga Sadar",
            "bn": "চুয়াডাঙ্গা সদর"
          },
          {
            "name": "Damurhuda",
            "bn": "দামুড়হুদা"
          },
          {
            "name": "Jibannagar",
            "bn": "জীবননগর"
          }
        ]
      },
      {
        "name": "Jashore",
        "bn": "যশোর",
        "thanas": [
          {
            "name": "Abhaynagar",
            "bn": "অভয়নগর"
          },
          {
            "name": "Bagherpara",
            "bn": "বাঘারপাড়া"
          },
          {
            "name": "Chougachha",
            "bn": "চৌগাছা"
          },
          {
            "name": "Jessore Sadar",
            "bn": "যশোর সদর"
          },
          {
            "name": "Jhikargacha",
            "bn": "ঝিকরগাছা"
          },
          {
            "name": "Keshabpur",
            "bn": "কেশবপুর"
          },
          {
            "name": "Manirampur",
            "bn": "মণিরামপুর"
          },
          {
            "name": "Sharsha",
            "bn": "শার্শা"
          }
        ]
      },
      {
        "name": "Jhenaidah",
        "bn": "ঝিনাইদহ",
        "thanas": [
          {
            "name": "Harinakundu",
            "bn": "হরিণাকুন্ডু"
          },
          {
            "name": "Jhenaidah Sadar",
            "bn": "ঝিনাইদহ সদর"
          },
          {
            "name": "Kaliganj",
            "bn": "কালীগঞ্জ"
          },
          {
            "name": "Kotchandpur",
            "bn": "কোটচাঁদপুর"
          },
          {
            "name": "Moheshpur",
            "bn": "মহেশপুর"
          },
          {
            "name": "Shailkupa",
            "bn": "শৈলকুপা"
          }
        ]
      },
      {
        "name": "Khulna",
        "bn": "খুলনা",
        "thanas": [
          {
            "name": "Botiaghata",
            "bn": "বটিয়াঘাটা"
          },
          {
            "name": "Dakop",
            "bn": "দাকোপ"
          },
          {
            "name": "Digholia",
            "bn": "দিঘলিয়া"
          },
          {
            "name": "Dumuria",
            "bn": "ডুমুরিয়া"
          },
          {
            "name": "Fultola",
            "bn": "ফুলতলা"
          },
          {
            "name": "Koyra",
            "bn": "কয়রা"
          },
          {
            "name": "Paikgasa",
            "bn": "পাইকগাছা"
          },
          {
            "name": "Rupsha",
            "bn": "রূপসা"
          },
          {
            "name": "Terokhada",
            "bn": "তেরখাদা"
          }
        ]
      },
      {
        "name": "Kushtia",
        "bn": "কুষ্টিয়া",
        "thanas": [
          {
            "name": "Bheramara",
            "bn": "ভেড়ামারা"
          },
          {
            "name": "Daulatpur",
            "bn": "দৌলতপুর"
          },
          {
            "name": "Khoksa",
            "bn": "খোকসা"
          },
          {
            "name": "Kumarkhali",
            "bn": "কুমারখালী"
          },
          {
            "name": "Kushtia Sadar",
            "bn": "কুষ্টিয়া সদর"
          },
          {
            "name": "Mirpur",
            "bn": "মিরপুর"
          }
        ]
      },
      {
        "name": "Magura",
        "bn": "মাগুরা",
        "thanas": [
          {
            "name": "Magura Sadar",
            "bn": "মাগুরা সদর"
          },
          {
            "name": "Mohammadpur",
            "bn": "মহম্মদপুর"
          },
          {
            "name": "Shalikha",
            "bn": "শালিখা"
          },
          {
            "name": "Sreepur",
            "bn": "শ্রীপুর"
          }
        ]
      },
      {
        "name": "Meherpur",
        "bn": "মেহেরপুর",
        "thanas": [
          {
            "name": "Gangni",
            "bn": "গাংনী"
          },
          {
            "name": "Meherpur Sadar",
            "bn": "মেহেরপুর সদর"
          },
          {
            "name": "Mujibnagar",
            "bn": "মুজিবনগর"
          }
        ]
      },
      {
        "name": "Narail",
        "bn": "নড়াইল",
        "thanas": [
          {
            "name": "Kalia",
            "bn": "কালিয়া"
          },
          {
            "name": "Lohagara",
            "bn": "লোহাগড়া"
          },
          {
            "name": "Narail Sadar",
            "bn": "নড়াইল সদর"
          }
        ]
      },
      {
        "name": "Satkhira",
        "bn": "সাতক্ষীরা",
        "thanas": [
          {
            "name": "Assasuni",
            "bn": "আশাশুনি"
          },
          {
            "name": "Debhata",
            "bn": "দেবহাটা"
          },
          {
            "name": "Kalaroa",
            "bn": "কলারোয়া"
          },
          {
            "name": "Kaliganj",
            "bn": "কালিগঞ্জ"
          },
          {
            "name": "Satkhira Sadar",
            "bn": "সাতক্ষীরা সদর"
          },
          {
            "name": "Shyamnagar",
            "bn": "শ্যামনগর"
          },
          {
            "name": "Tala",
            "bn": "তালা"
          }
        ]
      }
    ]
  },
  {
    "name": "Mymensingh",
    "bn": "ময়মনসিংহ",
    "districts": [
      {
        "name": "Jamalpur",
        "bn": "জামালপুর",
        "thanas": [
          {
            "name": "Bokshiganj",
            "bn": "বকশীগঞ্জ"
          },
          {
            "name": "Dewangonj",
            "bn": "দেওয়ানগঞ্জ"
          },
          {
            "name": "Islampur",
            "bn": "ইসলামপুর"
          },
          {
            "name": "Jamalpur Sadar",
            "bn": "জামালপুর সদর"
          },
          {
            "name": "Madarganj",
            "bn": "মাদারগঞ্জ"
          },
          {
            "name": "Melandah",
            "bn": "মেলান্দহ"
          },
          {
            "name": "Sarishabari",
            "bn": "সরিষাবাড়ী"
          }
        ]
      },
      {
        "name": "Mymensingh",
        "bn": "ময়মনসিংহ",
        "thanas": [
          {
            "name": "Bhaluka",
            "bn": "ভালুকা"
          },
          {
            "name": "Dhobaura",
            "bn": "ধোবাউড়া"
          },
          {
            "name": "Fulbaria",
            "bn": "ফুলবাড়ীয়া"
          },
          {
            "name": "Gafargaon",
            "bn": "গফরগাঁও"
          },
          {
            "name": "Gouripur",
            "bn": "গৌরীপুর"
          },
          {
            "name": "Haluaghat",
            "bn": "হালুয়াঘাট"
          },
          {
            "name": "Iswarganj",
            "bn": "ঈশ্বরগঞ্জ"
          },
          {
            "name": "Muktagacha",
            "bn": "মুক্তাগাছা"
          },
          {
            "name": "Mymensingh Sadar",
            "bn": "ময়মনসিংহ সদর"
          },
          {
            "name": "Nandail",
            "bn": "নান্দাইল"
          },
          {
            "name": "Phulpur",
            "bn": "ফুলপুর"
          },
          {
            "name": "Tarakanda",
            "bn": "তারাকান্দা"
          },
          {
            "name": "Trishal",
            "bn": "ত্রিশাল"
          }
        ]
      },
      {
        "name": "Netrokona",
        "bn": "নেত্রকোণা",
        "thanas": [
          {
            "name": "Atpara",
            "bn": "আটপাড়া"
          },
          {
            "name": "Barhatta",
            "bn": "বারহাট্টা"
          },
          {
            "name": "Durgapur",
            "bn": "দুর্গাপুর"
          },
          {
            "name": "Kalmakanda",
            "bn": "কলমাকান্দা"
          },
          {
            "name": "Kendua",
            "bn": "কেন্দুয়া"
          },
          {
            "name": "Khaliajuri",
            "bn": "খালিয়াজুরী"
          },
          {
            "name": "Madan",
            "bn": "মদন"
          },
          {
            "name": "Mohongonj",
            "bn": "মোহনগঞ্জ"
          },
          {
            "name": "Netrokona Sadar",
            "bn": "নেত্রকোণা সদর"
          },
          {
            "name": "Purbadhala",
            "bn": "পূর্বধলা"
          }
        ]
      },
      {
        "name": "Sherpur",
        "bn": "শেরপুর",
        "thanas": [
          {
            "name": "Jhenaigati",
            "bn": "ঝিনাইগাতী"
          },
          {
            "name": "Nalitabari",
            "bn": "নালিতাবাড়ী"
          },
          {
            "name": "Nokla",
            "bn": "নকলা"
          },
          {
            "name": "Sherpur Sadar",
            "bn": "শেরপুর সদর"
          },
          {
            "name": "Sreebordi",
            "bn": "শ্রীবরদী"
          }
        ]
      }
    ]
  },
  {
    "name": "Rajshahi",
    "bn": "রাজশাহী",
    "districts": [
      {
        "name": "Bogura",
        "bn": "বগুড়া",
        "thanas": [
          {
            "name": "Adamdighi",
            "bn": "আদমদিঘি"
          },
          {
            "name": "Bogra Sadar",
            "bn": "বগুড়া সদর"
          },
          {
            "name": "Dhunot",
            "bn": "ধুনট"
          },
          {
            "name": "Dupchanchia",
            "bn": "দুপচাচিঁয়া"
          },
          {
            "name": "Gabtali",
            "bn": "গাবতলী"
          },
          {
            "name": "Kahaloo",
            "bn": "কাহালু"
          },
          {
            "name": "Nondigram",
            "bn": "নন্দিগ্রাম"
          },
          {
            "name": "Shajahanpur",
            "bn": "শাজাহানপুর"
          },
          {
            "name": "Shariakandi",
            "bn": "সারিয়াকান্দি"
          },
          {
            "name": "Sherpur",
            "bn": "শেরপুর"
          },
          {
            "name": "Shibganj",
            "bn": "শিবগঞ্জ"
          },
          {
            "name": "Sonatala",
            "bn": "সোনাতলা"
          }
        ]
      },
      {
        "name": "Chapainawabganj",
        "bn": "চাঁপাইনবাবগঞ্জ",
        "thanas": [
          {
            "name": "Bholahat",
            "bn": "ভোলাহাট"
          },
          {
            "name": "Chapainawabganj Sadar",
            "bn": "চাঁপাইনবাবগঞ্জ সদর"
          },
          {
            "name": "Gomostapur",
            "bn": "গোমস্তাপুর"
          },
          {
            "name": "Nachol",
            "bn": "নাচোল"
          },
          {
            "name": "Shibganj",
            "bn": "শিবগঞ্জ"
          }
        ]
      },
      {
        "name": "Joypurhat",
        "bn": "জয়পুরহাট",
        "thanas": [
          {
            "name": "Akkelpur",
            "bn": "আক্কেলপুর"
          },
          {
            "name": "Joypurhat Sadar",
            "bn": "জয়পুরহাট সদর"
          },
          {
            "name": "Kalai",
            "bn": "কালাই"
          },
          {
            "name": "Khetlal",
            "bn": "ক্ষেতলাল"
          },
          {
            "name": "Panchbibi",
            "bn": "পাঁচবিবি"
          }
        ]
      },
      {
        "name": "Naogaon",
        "bn": "নওগাঁ",
        "thanas": [
          {
            "name": "Atrai",
            "bn": "আত্রাই"
          },
          {
            "name": "Badalgachi",
            "bn": "বদলগাছী"
          },
          {
            "name": "Dhamoirhat",
            "bn": "ধামইরহাট"
          },
          {
            "name": "Manda",
            "bn": "মান্দা"
          },
          {
            "name": "Mohadevpur",
            "bn": "মহাদেবপুর"
          },
          {
            "name": "Naogaon Sadar",
            "bn": "নওগাঁ সদর"
          },
          {
            "name": "Niamatpur",
            "bn": "নিয়ামতপুর"
          },
          {
            "name": "Patnitala",
            "bn": "পত্নিতলা"
          },
          {
            "name": "Porsha",
            "bn": "পোরশা"
          },
          {
            "name": "Raninagar",
            "bn": "রাণীনগর"
          },
          {
            "name": "Sapahar",
            "bn": "সাপাহার"
          }
        ]
      },
      {
        "name": "Natore",
        "bn": "নাটোর",
        "thanas": [
          {
            "name": "Bagatipara",
            "bn": "বাগাতিপাড়া"
          },
          {
            "name": "Baraigram",
            "bn": "বড়াইগ্রাম"
          },
          {
            "name": "Gurudaspur",
            "bn": "গুরুদাসপুর"
          },
          {
            "name": "Lalpur",
            "bn": "লালপুর"
          },
          {
            "name": "Naldanga",
            "bn": "নলডাঙ্গা"
          },
          {
            "name": "Natore Sadar",
            "bn": "নাটোর সদর"
          },
          {
            "name": "Singra",
            "bn": "সিংড়া"
          }
        ]
      },
      {
        "name": "Pabna",
        "bn": "পাবনা",
        "thanas": [
          {
            "name": "Atghoria",
            "bn": "আটঘরিয়া"
          },
          {
            "name": "Bera",
            "bn": "বেড়া"
          },
          {
            "name": "Bhangura",
            "bn": "ভাঙ্গুড়া"
          },
          {
            "name": "Chatmohar",
            "bn": "চাটমোহর"
          },
          {
            "name": "Faridpur",
            "bn": "ফরিদপুর"
          },
          {
            "name": "Ishurdi",
            "bn": "ঈশ্বরদী"
          },
          {
            "name": "Pabna Sadar",
            "bn": "পাবনা সদর"
          },
          {
            "name": "Santhia",
            "bn": "সাঁথিয়া"
          },
          {
            "name": "Sujanagar",
            "bn": "সুজানগর"
          }
        ]
      },
      {
        "name": "Rajshahi",
        "bn": "রাজশাহী",
        "thanas": [
          {
            "name": "Bagha",
            "bn": "বাঘা"
          },
          {
            "name": "Bagmara",
            "bn": "বাগমারা"
          },
          {
            "name": "Charghat",
            "bn": "চারঘাট"
          },
          {
            "name": "Durgapur",
            "bn": "দুর্গাপুর"
          },
          {
            "name": "Godagari",
            "bn": "গোদাগাড়ী"
          },
          {
            "name": "Mohonpur",
            "bn": "মোহনপুর"
          },
          {
            "name": "Paba",
            "bn": "পবা"
          },
          {
            "name": "Puthia",
            "bn": "পুঠিয়া"
          },
          {
            "name": "Tanore",
            "bn": "তানোর"
          }
        ]
      },
      {
        "name": "Sirajganj",
        "bn": "সিরাজগঞ্জ",
        "thanas": [
          {
            "name": "Belkuchi",
            "bn": "বেলকুচি"
          },
          {
            "name": "Chauhali",
            "bn": "চৌহালি"
          },
          {
            "name": "Kamarkhand",
            "bn": "কামারখন্দ"
          },
          {
            "name": "Kazipur",
            "bn": "কাজীপুর"
          },
          {
            "name": "Raigonj",
            "bn": "রায়গঞ্জ"
          },
          {
            "name": "Shahjadpur",
            "bn": "শাহজাদপুর"
          },
          {
            "name": "Sirajganj Sadar",
            "bn": "সিরাজগঞ্জ সদর"
          },
          {
            "name": "Tarash",
            "bn": "তাড়াশ"
          },
          {
            "name": "Ullapara",
            "bn": "উল্লাপাড়া"
          }
        ]
      }
    ]
  },
  {
    "name": "Rangpur",
    "bn": "রংপুর",
    "districts": [
      {
        "name": "Dinajpur",
        "bn": "দিনাজপুর",
        "thanas": [
          {
            "name": "Birampur",
            "bn": "বিরামপুর"
          },
          {
            "name": "Birganj",
            "bn": "বীরগঞ্জ"
          },
          {
            "name": "Birol",
            "bn": "বিরল"
          },
          {
            "name": "Bochaganj",
            "bn": "বোচাগঞ্জ"
          },
          {
            "name": "Chirirbandar",
            "bn": "চিরিরবন্দর"
          },
          {
            "name": "Dinajpur Sadar",
            "bn": "দিনাজপুর সদর"
          },
          {
            "name": "Fulbari",
            "bn": "ফুলবাড়ী"
          },
          {
            "name": "Ghoraghat",
            "bn": "ঘোড়াঘাট"
          },
          {
            "name": "Hakimpur",
            "bn": "হাকিমপুর"
          },
          {
            "name": "Kaharol",
            "bn": "কাহারোল"
          },
          {
            "name": "Khansama",
            "bn": "খানসামা"
          },
          {
            "name": "Nawabganj",
            "bn": "নবাবগঞ্জ"
          },
          {
            "name": "Parbatipur",
            "bn": "পার্বতীপুর"
          }
        ]
      },
      {
        "name": "Gaibandha",
        "bn": "গাইবান্ধা",
        "thanas": [
          {
            "name": "Gaibandha Sadar",
            "bn": "গাইবান্ধা সদর"
          },
          {
            "name": "Gobindaganj",
            "bn": "গোবিন্দগঞ্জ"
          },
          {
            "name": "Palashbari",
            "bn": "পলাশবাড়ী"
          },
          {
            "name": "Phulchari",
            "bn": "ফুলছড়ি"
          },
          {
            "name": "Sadullapur",
            "bn": "সাদুল্লাপুর"
          },
          {
            "name": "Saghata",
            "bn": "সাঘাটা"
          },
          {
            "name": "Sundarganj",
            "bn": "সুন্দরগঞ্জ"
          }
        ]
      },
      {
        "name": "Kurigram",
        "bn": "কুড়িগ্রাম",
        "thanas": [
          {
            "name": "Bhurungamari",
            "bn": "ভুরুঙ্গামারী"
          },
          {
            "name": "Charrajibpur",
            "bn": "চর রাজিবপুর"
          },
          {
            "name": "Chilmari",
            "bn": "চিলমারী"
          },
          {
            "name": "Kurigram Sadar",
            "bn": "কুড়িগ্রাম সদর"
          },
          {
            "name": "Nageshwari",
            "bn": "নাগেশ্বরী"
          },
          {
            "name": "Phulbari",
            "bn": "ফুলবাড়ী"
          },
          {
            "name": "Rajarhat",
            "bn": "রাজারহাট"
          },
          {
            "name": "Rowmari",
            "bn": "রৌমারী"
          },
          {
            "name": "Ulipur",
            "bn": "উলিপুর"
          }
        ]
      },
      {
        "name": "Lalmonirhat",
        "bn": "লালমনিরহাট",
        "thanas": [
          {
            "name": "Aditmari",
            "bn": "আদিতমারী"
          },
          {
            "name": "Hatibandha",
            "bn": "হাতীবান্ধা"
          },
          {
            "name": "Kaliganj",
            "bn": "কালীগঞ্জ"
          },
          {
            "name": "Lalmonirhat Sadar",
            "bn": "লালমনিরহাট সদর"
          },
          {
            "name": "Patgram",
            "bn": "পাটগ্রাম"
          }
        ]
      },
      {
        "name": "Nilphamari",
        "bn": "নীলফামারী",
        "thanas": [
          {
            "name": "Dimla",
            "bn": "ডিমলা"
          },
          {
            "name": "Domar",
            "bn": "ডোমার"
          },
          {
            "name": "Jaldhaka",
            "bn": "জলঢাকা"
          },
          {
            "name": "Kishorganj",
            "bn": "কিশোরগঞ্জ"
          },
          {
            "name": "Nilphamari Sadar",
            "bn": "নীলফামারী সদর"
          },
          {
            "name": "Syedpur",
            "bn": "সৈয়দপুর"
          }
        ]
      },
      {
        "name": "Panchagarh",
        "bn": "পঞ্চগড়",
        "thanas": [
          {
            "name": "Atwari",
            "bn": "আটোয়ারী"
          },
          {
            "name": "Boda",
            "bn": "বোদা"
          },
          {
            "name": "Debiganj",
            "bn": "দেবীগঞ্জ"
          },
          {
            "name": "Panchagarh Sadar",
            "bn": "পঞ্চগড় সদর"
          },
          {
            "name": "Tetulia",
            "bn": "তেতুলিয়া"
          }
        ]
      },
      {
        "name": "Rangpur",
        "bn": "রংপুর",
        "thanas": [
          {
            "name": "Badargonj",
            "bn": "বদরগঞ্জ"
          },
          {
            "name": "Gangachara",
            "bn": "গংগাচড়া"
          },
          {
            "name": "Kaunia",
            "bn": "কাউনিয়া"
          },
          {
            "name": "Mithapukur",
            "bn": "মিঠাপুকুর"
          },
          {
            "name": "Pirgacha",
            "bn": "পীরগাছা"
          },
          {
            "name": "Pirgonj",
            "bn": "পীরগঞ্জ"
          },
          {
            "name": "Rangpur Sadar",
            "bn": "রংপুর সদর"
          },
          {
            "name": "Taragonj",
            "bn": "তারাগঞ্জ"
          }
        ]
      },
      {
        "name": "Thakurgaon",
        "bn": "ঠাকুরগাঁও",
        "thanas": [
          {
            "name": "Baliadangi",
            "bn": "বালিয়াডাঙ্গী"
          },
          {
            "name": "Haripur",
            "bn": "হরিপুর"
          },
          {
            "name": "Pirganj",
            "bn": "পীরগঞ্জ"
          },
          {
            "name": "Ranisankail",
            "bn": "রাণীশংকৈল"
          },
          {
            "name": "Thakurgaon Sadar",
            "bn": "ঠাকুরগাঁও সদর"
          }
        ]
      }
    ]
  },
  {
    "name": "Sylhet",
    "bn": "সিলেট",
    "districts": [
      {
        "name": "Habiganj",
        "bn": "হবিগঞ্জ",
        "thanas": [
          {
            "name": "Ajmiriganj",
            "bn": "আজমিরীগঞ্জ"
          },
          {
            "name": "Bahubal",
            "bn": "বাহুবল"
          },
          {
            "name": "Baniachong",
            "bn": "বানিয়াচং"
          },
          {
            "name": "Chunarughat",
            "bn": "চুনারুঘাট"
          },
          {
            "name": "Habiganj Sadar",
            "bn": "হবিগঞ্জ সদর"
          },
          {
            "name": "Lakhai",
            "bn": "লাখাই"
          },
          {
            "name": "Madhabpur",
            "bn": "মাধবপুর"
          },
          {
            "name": "Nabiganj",
            "bn": "নবীগঞ্জ"
          }
        ]
      },
      {
        "name": "Moulvibazar",
        "bn": "মৌলভীবাজার",
        "thanas": [
          {
            "name": "Barlekha",
            "bn": "বড়লেখা"
          },
          {
            "name": "Juri",
            "bn": "জুড়ী"
          },
          {
            "name": "Kamolganj",
            "bn": "কমলগঞ্জ"
          },
          {
            "name": "Kulaura",
            "bn": "কুলাউড়া"
          },
          {
            "name": "Moulvibazar Sadar",
            "bn": "মৌলভীবাজার সদর"
          },
          {
            "name": "Rajnagar",
            "bn": "রাজনগর"
          },
          {
            "name": "Sreemangal",
            "bn": "শ্রীমঙ্গল"
          }
        ]
      },
      {
        "name": "Sunamganj",
        "bn": "সুনামগঞ্জ",
        "thanas": [
          {
            "name": "Bishwambarpur",
            "bn": "বিশ্বম্ভরপুর"
          },
          {
            "name": "Chhatak",
            "bn": "ছাতক"
          },
          {
            "name": "Derai",
            "bn": "দিরাই"
          },
          {
            "name": "Dharmapasha",
            "bn": "ধর্মপাশা"
          },
          {
            "name": "Dowarabazar",
            "bn": "দোয়ারাবাজার"
          },
          {
            "name": "Jagannathpur",
            "bn": "জগন্নাথপুর"
          },
          {
            "name": "Jamalganj",
            "bn": "জামালগঞ্জ"
          },
          {
            "name": "Madhyanagar",
            "bn": "মধ্যনগর"
          },
          {
            "name": "Shalla",
            "bn": "শাল্লা"
          },
          {
            "name": "South Sunamganj",
            "bn": "দক্ষিণ সুনামগঞ্জ"
          },
          {
            "name": "Sunamganj Sadar",
            "bn": "সুনামগঞ্জ সদর"
          },
          {
            "name": "Tahirpur",
            "bn": "তাহিরপুর"
          }
        ]
      },
      {
        "name": "Sylhet",
        "bn": "সিলেট",
        "thanas": [
          {
            "name": "Balaganj",
            "bn": "বালাগঞ্জ"
          },
          {
            "name": "Beanibazar",
            "bn": "বিয়ানীবাজার"
          },
          {
            "name": "Bishwanath",
            "bn": "বিশ্বনাথ"
          },
          {
            "name": "Companiganj",
            "bn": "কোম্পানীগঞ্জ"
          },
          {
            "name": "Dakshinsurma",
            "bn": "দক্ষিণ সুরমা"
          },
          {
            "name": "Fenchuganj",
            "bn": "ফেঞ্চুগঞ্জ"
          },
          {
            "name": "Golapganj",
            "bn": "গোলাপগঞ্জ"
          },
          {
            "name": "Gowainghat",
            "bn": "গোয়াইনঘাট"
          },
          {
            "name": "Jaintiapur",
            "bn": "জৈন্তাপুর"
          },
          {
            "name": "Kanaighat",
            "bn": "কানাইঘাট"
          },
          {
            "name": "Osmaninagar",
            "bn": "ওসমানী নগর"
          },
          {
            "name": "Sylhet Sadar",
            "bn": "সিলেট সদর"
          },
          {
            "name": "Zakiganj",
            "bn": "জকিগঞ্জ"
          }
        ]
      }
    ]
  }
];

// [{ name, bn }] of all divisions.
export function divisions() {
  return BD_DIVISIONS.map((d) => ({ name: d.name, bn: d.bn }));
}

// Districts within a division (by English division name). [] if unknown.
export function districtsOf(divisionName) {
  const d = BD_DIVISIONS.find((x) => x.name === divisionName);
  return d ? d.districts.map((c) => ({ name: c.name, bn: c.bn })) : [];
}

// Thanas/upazilas within a district of a division. [] if unknown.
export function thanasOf(divisionName, districtName) {
  const d = BD_DIVISIONS.find((x) => x.name === divisionName);
  const c = d?.districts.find((x) => x.name === districtName);
  return c ? c.thanas.map((t) => ({ name: t.name, bn: t.bn })) : [];
}
