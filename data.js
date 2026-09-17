// data.js - بيانات الأساليب

const STYLES = [
    {
        id: "possession",
        name: "الاستحواذ",
        icon: "🎯",
        coaches: "بيب جوارديولا",
        desc: "السيطرة على الكرة، التمريرات القصيرة، والتمركز المثلثي",
        color: "#4A90E2",
        colorAlpha: "rgba(74, 144, 226, 0.2)",
        formations: ["4-3-3", "4-2-3-1"],
        attacking: {
            formation: "3-2-4-1",
            description: "تحول من 4-3-3 إلى 3-2-4-1 عند الهجوم"
        },
        defending: {
            formation: "4-4-2",
            description: "ضغط متوسط مع خط دفاع رباعي"
        }
    },
    {
        id: "counter",
        name: "المرتدات",
        icon: "⚡",
        coaches: "تشافي ألونسو، مورينهو، كلوب",
        desc: "دفاع صلب وانتقالات سريعة نحو الأمام",
        color: "#E74C3C",
        colorAlpha: "rgba(231, 76, 60, 0.2)",
        formations: ["4-4-2", "4-2-3-1"],
        attacking: {
            formation: "4-2-4",
            description: "تحول سريع مع 4 مهاجمين"
        },
        defending: {
            formation: "4-4-2",
            description: "كتلة دفاعية عميقة"
        }
    },
    {
        id: "total",
        name: "الاستحواذ الشامل",
        icon: "🌐",
        coaches: "دي شامب، كرويف",
        desc: "الجميع يهاجم والجميع يدافع، تبديل مستمر للمراكز",
        color: "#F39C12",
        colorAlpha: "rgba(243, 156, 18, 0.2)",
        formations: ["4-3-3"],
        attacking: {
            formation: "2-3-5",
            description: "تمدّد كامل في الملعب"
        },
        defending: {
            formation: "5-3-2",
            description: "جميع اللاعبين يتراجعون"
        }
    },
    {
        id: "longball",
        name: "الكرة الطويلة",
        icon: "🚀",
        coaches: "أموريم",
        desc: "كرات طويلة مباشرة نحو المهاجمين",
        color: "#9B59B6",
        colorAlpha: "rgba(155, 89, 182, 0.2)",
        formations: ["3-4-2-1"],
        attacking: {
            formation: "3-4-3",
            description: "مهاجمون يستقبلون الكرات الطويلة"
        },
        defending: {
            formation: "5-4-1",
            description: "دفاع كثيف مع مرتدة سريعة"
        }
    },
    {
        id: "highpress",
        name: "الضغط العالي",
        icon: "🔥",
        coaches: "لامبارد",
        desc: "ضغط مستمر في ملعب الخصم واستعادة الكرة بسرعة",
        color: "#E67E22",
        colorAlpha: "rgba(230, 126, 34, 0.2)",
        formations: ["4-3-3"],
        attacking: {
            formation: "4-1-2-3",
            description: "ضغط عالي مع تقدم الأظهرة"
        },
        defending: {
            formation: "4-3-3",
            description: "خط دفاع عالي مع ضغط فوري"
        }
    }
];
