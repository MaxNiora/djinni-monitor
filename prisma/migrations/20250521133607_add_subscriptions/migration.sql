-- CreateTable
CREATE TABLE "User" (
    "chatId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "Stack" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Stack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Subscriptions" (
    "A" INTEGER NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "_TagsOnVac" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Stack_name_key" ON "Stack"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_Subscriptions_AB_unique" ON "_Subscriptions"("A", "B");

-- CreateIndex
CREATE INDEX "_Subscriptions_B_index" ON "_Subscriptions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagsOnVac_AB_unique" ON "_TagsOnVac"("A", "B");

-- CreateIndex
CREATE INDEX "_TagsOnVac_B_index" ON "_TagsOnVac"("B");

-- AddForeignKey
ALTER TABLE "_Subscriptions" ADD CONSTRAINT "_Subscriptions_A_fkey" FOREIGN KEY ("A") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Subscriptions" ADD CONSTRAINT "_Subscriptions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagsOnVac" ADD CONSTRAINT "_TagsOnVac_A_fkey" FOREIGN KEY ("A") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagsOnVac" ADD CONSTRAINT "_TagsOnVac_B_fkey" FOREIGN KEY ("B") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
