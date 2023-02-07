export class BaseTensorService {
    constructor(public baseUrl: string, public vocabUrl: string, public threshold: number) {}

    loadMetadata() {
        console.info('was here');
    }

    loadModel() {
        console.info('ok');
        return null;
    }

    predict(message: string) {
        console.info(message);
        return {
            isOffensive: true,
            score: 0.9,
        };
    }
}
