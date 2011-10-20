describe("ImageCropper", function() {
    it("should create instance of ImageCropper", function() {
      var img = JAK.cel("img");
      var f = JAK.cel("form");
      
      document.body.appendChild(img);
      document.body.appendChild(f);
      
      var iC = new JAK.ImageCropper(img, f);
      expect(iC instanceof JAK.ImageCropper).toEqual(true);
    });
});
