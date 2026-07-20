import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screens = [
  {
    name: "the-corporate",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzJiMDYxNGEwNGU3NGE2NWUwM2I3YmVlEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuiPZPzdQxv5OnLGAYgkv-OFcrLD0-REsSqLP8b8cOmBxEpVLxUj30u5KkInkXcyGVqwiN5Clz7luoJg-zQcu7zisPJAEYABGBsC-IlnbO-wxe1KtroYqEc8jgLxbcw1vS7g6SaZ_aiIJ7TgAeDkhfzkVzom09ET2NmGX_-j25t4avnwZuLW_2NVYiiUZR8ex-rYGRGGwJdGxG3zQvx4B6ZchDJLHx33_El-ZWb_6fdoEKnTH131P1aI3Cy"
  },
  {
    name: "the-executive",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzMzZmY4MWYwM2ZiMmU5Y2NiMTdhYmRlEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLs3Jo4uyigra-3hwjsTHRbKQYV9CraBsxk1QiD3nqeok2k1XazEjUO-gMRDv-XNTdNOC0-zdp8BA9nYu6PhsJ2Br0vFoD3mp-ofmx1Omy833goKIMVWZlWLmwhkLONs1IUaC9Gc3SyzzHPJp4kUSvxamvybwroPnNwty1oTSnfk5DRR1hH0IKjBTBtPr7yOBp6DfXiDAUB_hkBKls6olk-Nx2CjWHWD0PaUfzvwlEOKU8kihMrf9ZTQGRfL"
  },
  {
    name: "the-strategist",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzM2MDljNjkwNGE0NTRhNmZkMDU1NjQxEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvxf2PELNE7wEb1ClJirSUjbBB7eJd4wMRAbTU_i3dvj8ftzGZTLZQkKIsq7qXus-7qbSiyFAHNrXHVe9fgmiFoc_IpeALVS_C8ri9jNEMK1zYT6-Yy7KzDn9A5RtwvitwYjlFLxztZYIRzyO0UygFMC35vSS_tHMw-vW0fU8yZ2QlMU1t-8T9Hlj83KNt3tSqk5-15hk2-OD3BhwcGp0mPI34taDWJfHZx9lHDI1_AWTnCDgzjKPnydBWj"
  },
  {
    name: "the-creative-director",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzY3OTI4YzcwNDRmNzM4ZTAzMzNlNzE0EgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLs_vnVLHq87xJ5rmECu1fjzZ7i2e19WN0TDvf_I5865J4gcrT97Pqr0AtVTehvh2qnsYADv2s7rM0hNnCcjwcm9NyS4mVXoBpOt16DrQXLBZZuUlWJcXujwGDAX5xsQvFLEzWDy6WUy0air6baswu4PTSVze3pwFXW9YPKDc2idyhPh8VUzZrLjIdSKuH_soqPa3Rgjto7Hu_p4RGYEUANGgNELgCscz51ZPjlsxprbqLaaBt-2s8dXaYk"
  },
  {
    name: "the-partner",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzJlZmZiMjQwOTY4OTQxNTZlMWFiYThkEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuGocOLUlCvfIYMyqo5mmXP6vsKZ_PAvXygCIdL4aX18GMHZeg5bYZ4lZuTV-k-g5omXzmgDywfYr2XrdKIn6YMvHAMeXwukU-tomT61wL4zOKt6lG_AaY7lSvL51fYE56By91UnIelQ_iGgrH9zj2EI72At0KT41-uAv2v1UZwojbHhUpBzafZLXmAR1KAMw0QnhYyL3djQNVBBgQybCunqytGe0Akr_8EsNH7hGm32Ct6cl3qdVxh0Wt-"
  },
  {
    name: "the-innovator",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzZjYTI2ZjUwNGE0NTRhNmZkMDU1NjQxEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLv3749Dgro8c41borLzfjl0fJG-Yaa0GUiLAqYYTCfDBjG0tyRQDXMODP-UF8kAMll6GbfJbS1dgbhsfkS02GlDQCIXRYK5HnXKlyt16p6oRfYPgWgyFZ6AB2tPcd_edROCh8YTRCL-9jwbTBqH9u03nPPmkpwOpBFA_QA3MC7me7DdIJdgntWwAFD-ub63YUSS_hT9sBAQX51AjZdfnm4t948cFeSyXKmpUOwQY7oid-rrqouJmOddnRMc"
  },
  {
    name: "the-digital-nomad",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzZiYTI0NTEwOTY4OTY5MDkxMTNkYTJmEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvfIl4Ui1qMxfi5jKquXPF2Hb7W62u8VVT6OrOW_cTqncPklBK2tbI0NoR-LhU13exgNId3G_awCrRJ450lxx8TxV7LLthyIK4_z42nnN9QG1j3LG_lO2LI1a2LQW7Z5gJwHn4-z5ZD5scjv9uzTkAeo4R-vreDH8treh0IoRKfbUA6H_LI6ynob_bNKkHWWsAQCgoaCMpskMCZxR-Bt7SSRQIMO9e4Hwxrs4Xw-6WW4CrZdncN5_cNs1ve"
  },
  {
    name: "the-social-media-pro",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzZhYzcyZWIwNGE0NTRhNmZkMDU1NjQxEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvnTER4axee_KG_5ennKTO4PdP1Ig0OyWnwLoApKAhn5jPq-ed7OAnzqAnE61CW83PXnwezYQwX2IJLryCi6uFkdy19LxtiZt3mbD6WGmzuX8uBoHHQS9WtA1RWeESax-IBJFJhJ2YcotKPOUjiH2zQ5Y3iagfoegWgI6lrysEwdicFHxOofkb7iXESbj4yNJGNfqGr0oqBiJ-AwRgNq_UxKixFCKqgMp3wAMYXI6FBHlQo-fJwVbavyto"
  },
  {
    name: "the-brand-architect",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzY5MDBlMjAwOTY4OTQxNTZlMWFiYThkEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLsvs5kb-8RaZLpz0_9cncOVC-QcJqxnNtXYFJv2uwNJa7cR_nXrEQmWGHIxIowzjRmiIxAHYT9gL5rpIZLj1iyaU-yX9MUSObPVKNthIrIFGlbxmDyiMFYzuXzDRllSqqMHkkISIOXQGo2TS7IsTl6eLeCFzjrlTnh7R9TEeJVxNetBVF84d7T-nq4MdWEAI1f5OyQ0vuL3b47IdwLTNVP69GC_eg3DRHXB4xXa4TTzYtRp7hac2R0GI5M"
  },
  {
    name: "the-typographer",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjYzk1NDg3YjgwNDRmNzM4ZTAzMzNlNzE0EgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLt3Xr6-aiTAboL0spqQP3e5_pHTSU5iWY6L2B7aEVKHNlJcgo37aqNnHXcoWrs_f2SYZUPrnJOnyqoeie6D4O40eT-AO2UhuzV96X-eMOLPsfGo3GWBLlxVW5Hf7Bg7kJvK4DziHUuK5drAM7VRj_u04LXfH96rvrPm2k87t2zudXMlunZR2aYPf7MjY6AaY9sesCDS9TTJ8B5CKJEd16teeyDyWKM--i_DWRXx5RCbEY8ACDo7UIJNTKHG"
  },
  {
    name: "the-researcher",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjY2Q1YmMzNDEwMjI3YmY0Zjc5MmQ2YmQ1EgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvG2IO5L1Ho8lmgYtiELu5gTUTzDNEJ8w3csc9hGWkDYTD_jPCNCMYQB5whdP3sk1mUzUSHPXuWRsnvOd3qtQKb8AjXWb2Czr-pEBYkL9nqvI8CitWCeIp77e9PTvJvip3mreeSDKuhoVCcvt9I-EFAFNx5NU1JFZOj7bpVcpfLKRqulmrDChIRWdXkWz1mQAn0ZFAvCdURtlAG7E9VjLY_nZ1q02PLrTD8x66MUaJYrxIbyKY671VjjnFf"
  },
  {
    name: "the-engineer",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJjY2QxMzk0OWUwNGE0NTRhNmZkMDU1NjQxEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLsqK80tv2C95RHvqh9vWUlrKrFgFOo9B010FOjbwaBRabIEPNwVIdjGat-Zrk2TgvGQjsmelZjE3ASnNS3SN_5fhK0vHqxIbLiSZno3nMynDTJItvuyae6jdrBPmhbvvJ75KV_mjp6a1bnu5WhVPFmN88OeaDMHe-HDRgwbSdcZrDk9F39pBnEGPyucX6xOYxvXMLAx5RvUNYNGoykoEayyJVKV7DL23TfqNwynhIKa8Vl71CnqAfQSCp0y"
  },
  {
    name: "the-distinguished",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJkNGIzNjdjMDQwMjNiZTZiNWU1MTRhNWYxEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLs-2vQnQFwiM8WGM1MSGK5SwfrJDhZjJPmpoS8gWVQhnYmTrSId8rdcWqyaJRcw6EhBS-COM6eYdzruh1a-IasXLzBPC06RTRELIT8ifNJKNCXmRS1u7gFKSW2zoI1fS4BGZU21m3U1R5SfTzWJ2wv6YZkeIrOYPMW5PQ3IxQGaKxKnwyt00L7-Nu7ehqmp1X8ZKoF4Eh5_rC_1iWBj0J-q0moP7tBkz1P-ru1wZK6tqIZoolFQIjmbr8Q"
  },
  {
    name: "the-researcher-updated",
    htmlUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NmJkMTQzMDk0MDIwM2ZiMmU5Y2NiMTdhYmRlEgsSBxDc3crM3hQYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjg1OTU5NDE2MDIwNjczMjQ3Ng&filename=&opi=89354086",
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLsm9z0HOloQKzNN6MdC0abFXublMjtGzO6nkG4dnASAC5EeC_tdG06lfnqKmTjIIWz0FckRXZ2FIaCxG83IlgdFEJS6SxqOdTZBpRAM9yoAvv3KU0b8zgNNdrjbuvWX4MsepvOdzaW2NJJ2SIskEkXk_mSSDtyHEqhOJlT7EKfaXaQkb5Oa75HYIM0HvcXQtebUg3nQJzmIaq-8aut-yCMFxkTHuiVJWDo6oJfQQWWsKPJ-Cy8bUitAa73g"
  }
];

const destDir = path.resolve(__dirname, '../assets/stitch');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log(`Downloading ${screens.length} screens to ${destDir}...`);
  for (const screen of screens) {
    try {
      console.log(`Downloading ${screen.name} HTML...`);
      await downloadFile(screen.htmlUrl, path.join(destDir, `${screen.name}.html`));
      
      console.log(`Downloading ${screen.name} Image...`);
      await downloadFile(screen.imageUrl, path.join(destDir, `${screen.name}.jpg`));
    } catch (err) {
      console.error(`Failed to download ${screen.name}:`, err);
    }
  }
  console.log("Done!");
}

main();
