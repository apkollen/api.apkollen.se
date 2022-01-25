export type ProductHistoryEntry = {
    url: string;
    productName: string;
    category: string;
    subcategory: string;
    unitVolume: number;
    unitPrice: number;
    alcvol: number;
    apk: number;
    articleNbr: number;
    retrievedDate: Date;
    markedAsDead: boolean;
    markedAsDeadDate?: Date;
    currentRank?: number;
    review?: ProductReview;
};

export type ProductReview = {
    score: number;
    text: string;
    reviewerName: string;
    createdDate: Date;
};