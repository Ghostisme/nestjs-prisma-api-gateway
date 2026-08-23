const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type DownloadFileOptions = {
	data: Blob | BlobPart;
	filename: string;
	mimeType?: string;
};

export const downloadFile = ({ data, filename, mimeType }: DownloadFileOptions) => {
	const resolvedMime = mimeType ?? "application/octet-stream";
	const fileBlob =
		data instanceof Blob
			? data.type
				? data
				: new Blob([data], { type: resolvedMime })
			: new Blob([data], { type: resolvedMime });
	const blobUrl = URL.createObjectURL(fileBlob);
	const link = document.createElement("a");
	link.href = blobUrl;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(blobUrl);
};

export const downloadExcelFile = (data: DownloadFileOptions["data"], filename: string) =>
	downloadFile({ data, filename, mimeType: EXCEL_MIME });
