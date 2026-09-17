export function parseCSV(text: string): string[][] {
	const rows = [];
	let field = "";
	let row = [];
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const character = text[i];
		if (inQuotes) {
			if (character === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += character;
			}
		} else if (character === '"') {
			inQuotes = true;
		} else if (character === ",") {
			row.push(field);
			field = "";
		} else if (character === "\n") {
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else if (character !== "\r") {
			field += character;
		}
	}
	if (inQuotes) throw new Error("CSV ended inside a quoted field");
	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows;
}
