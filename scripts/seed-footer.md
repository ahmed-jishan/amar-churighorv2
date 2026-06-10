# Footer Sections Seed Data

Footer sections are stored as a single document inside the `settings` collection
(`settings/footer_sections`), exactly like `store_config` and `hero_config`.

Since this uses the already-deployed `settings` collection, **no new rules or
indexes need to be deployed** — the free-tier rules already allow it.

## Steps — Firebase Console

1. Go to: Firebase Console → Firestore Database
2. Find the **settings** collection
3. Click **Add Document** with ID: `footer_sections`
4. Add a single field named `sections` of type **array**
5. Add the following array items (map type):

### Entry 1 — About Us

| Field       | Type    | Value                                                |
|-------------|---------|------------------------------------------------------|
| id          | string  | about-us (or any unique value)                       |
| title       | string  | About Us                                              |
| links       | array   | [see below]                                          |
| is_visible  | boolean | true                                                 |
| sort_order  | number  | 0                                                    |
| createdAt   | string  | 2026-06-11T00:00:00.000Z                             |
| updatedAt   | string  | 2026-06-11T00:00:00.000Z                             |

For the `links` array inside this entry, add these maps:

| label     | url      | open_in_new_tab |
|-----------|----------|-----------------|
| Home      | /        | false           |
| About Us  | /about   | false           |
| Contact   | /contact | false           |

### Entry 2 — Quick Links

| Field       | Type    | Value                                                |
|-------------|---------|------------------------------------------------------|
| id          | string  | quick-links                                          |
| title       | string  | Quick Links                                          |
| links       | array   | [see below]                                          |
| is_visible  | boolean | true                                                 |
| sort_order  | number  | 1                                                    |
| createdAt   | string  | 2026-06-11T00:00:00.000Z                             |
| updatedAt   | string  | 2026-06-11T00:00:00.000Z                             |

Links:

| label         | url          | open_in_new_tab |
|---------------|--------------|-----------------|
| All Products  | /products    | false           |
| Categories    | /categories  | false           |
| Offers        | /offers      | false           |

### Final `sections` array structure (as JSON)

```json
[
  {
    "id": "about-us",
    "title": "About Us",
    "links": [
      { "label": "Home", "url": "/", "open_in_new_tab": false },
      { "label": "About Us", "url": "/about", "open_in_new_tab": false },
      { "label": "Contact", "url": "/contact", "open_in_new_tab": false }
    ],
    "is_visible": true,
    "sort_order": 0,
    "createdAt": "2026-06-11T00:00:00.000Z",
    "updatedAt": "2026-06-11T00:00:00.000Z"
  },
  {
    "id": "quick-links",
    "title": "Quick Links",
    "links": [
      { "label": "All Products", "url": "/products", "open_in_new_tab": false },
      { "label": "Categories", "url": "/categories", "open_in_new_tab": false },
      { "label": "Offers", "url": "/offers", "open_in_new_tab": false }
    ],
    "is_visible": true,
    "sort_order": 1,
    "createdAt": "2026-06-11T00:00:00.000Z",
    "updatedAt": "2026-06-11T00:00:00.000Z"
  }
]