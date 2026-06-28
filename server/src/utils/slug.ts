/**
 * Утиліти для генерації slug з української/російської латиницею
 */

const UKRAINIAN_MAP: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
    'ю': 'yu', 'я': 'ya', ' ': '-', '-': '-', '_': '-'
};

const RUSSIAN_MAP: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', ' ': '-', '-': '-', '_': '-'
};

/**
 * Проста транслітерація в латиницю
 */
export function transliterate(text: string): string {
    if (!text) return '';

    const lower = text.toLowerCase();
    let result = '';

    for (const char of lower) {
        // Спочатку українська мапа, потім російська як fallback
        if (UKRAINIAN_MAP[char] !== undefined) {
            result += UKRAINIAN_MAP[char];
        } else if (RUSSIAN_MAP[char] !== undefined) {
            result += RUSSIAN_MAP[char];
        } else if (/[a-z0-9]/.test(char)) {
            result += char;
        } else {
            result += '-';
        }
    }

    return result;
}

/**
 * Перетворити довільний текст в slug
 */
export function toSlug(text: string): string {
    if (!text) return '';

    return transliterate(text)
        .replace(/-+/g, '-')      // прибрати дубльовані дефіси
        .replace(/^-|-$/g, '')    // прибрати дефіси на початку/кінці
        .toLowerCase();
}

/**
 * Отримати slug для назви айтема з пріоритетом: eng > ukr > rus > item-{id}
 */
export function getItemSlug(item: {
    id: number;
    eng_name?: string | null;
    ukr_name?: string | null;
    rus_name?: string | null;
}): string {
    const name = item.eng_name || item.ukr_name || item.rus_name;
    if (name) {
        return toSlug(name) || `item-${item.id}`;
    }
    return `item-${item.id}`;
}

/**
 * Ім'я папки айтема: {id}-{slug}
 */
export function getItemFolderName(item: {
    id: number;
    eng_name?: string | null;
    ukr_name?: string | null;
    rus_name?: string | null;
}): string {
    return `${item.id}-${getItemSlug(item)}`;
}

/**
 * Генерувати ім'я файлу: {slug}-{index}.{ext}
 */
export function generateFileName(
    item: {
        id: number;
        eng_name?: string | null;
        ukr_name?: string | null;
        rus_name?: string | null;
    },
    index: number,
    originalName: string
): string {
    const slug = getItemSlug(item);
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${slug}-${index}.${ext}`;
}
