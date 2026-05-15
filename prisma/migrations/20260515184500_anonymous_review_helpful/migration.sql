ALTER TABLE "ReviewHelpful" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "ReviewHelpful" ADD COLUMN "visitorKey" STRING;

CREATE UNIQUE INDEX "ReviewHelpful_reviewId_visitorKey_key" ON "ReviewHelpful"("reviewId", "visitorKey");

CREATE INDEX "ReviewHelpful_visitorKey_idx" ON "ReviewHelpful"("visitorKey");
