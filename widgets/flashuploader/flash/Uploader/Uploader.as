package Uploader {
	import flash.external.*;
	/* 
		Hlavni trida balicku, vytvari instanci Comunikatoru a FileUploaderu
		a schranuje data z javascriptu v instancich trid DataFolder
	*/
	public class Uploader {
		/* Comunicator */
		public var comunicator:Comunicator;
		/* File Uploader */
		public var fileUpoader:FileUploader;
		/* data pro jednotlive javascriptove uploadery */
		public var dataFolder:Object;
		/* prave aktivni id */
		public var activeId:String;
		
		public function Uploader(){
			this.comunicator = new Comunicator(this);
			this.fileUpoader = new FileUploader(this);
			ExternalInterface.addCallback('bindJSClass',bindJSClass);
			ExternalInterface.addCallback('setFormData',setFormData);
			ExternalInterface.addCallback('removeFormData',removeFormData);
			ExternalInterface.addCallback('clearFormData',clearFormData);
			ExternalInterface.addCallback('updateItem',updateItem);
			ExternalInterface.addCallback('clear',clear);
			this.dataFolder =  new Object();
		}
		/* vyvtvoreni datoveho objektu pro dany upload */
		public function bindJSClass(param:Object):String{
			this.dataFolder[param.id] = new DataFolder(this,param.id,param.murl,param.mfilter,param.dt,param.minSize,param.maxSize,param.maxFilesCount);
			return param.id;
		}
		
		/* vraci datovy objekt pro dany upload */
		public function getDataFolder(id:String):Object{
			return this.dataFolder[id];
		}
		
		/* nastavi aktivni id */
		public function setActiveId(id:String):void{
			this.activeId = id;
		}
		
		/* vrati aktivni id */
		public function getActiveId():String{
			return this.activeId;
		}
		
		/* nastavi data, ktera se maji posilat s souborem */
		public function setFormData(data:Object):void{
			var folder:Object = this.getDataFolder(getActiveId());
			folder.setFormData(data);
		}
		/* aktualizuji jednu datovou polozku */
		public function updateItem(data:Object):void{
			var folder:Object = this.getDataFolder(getActiveId());
			folder.updateItemData(data);
		}
		
		/* odstrani datovou polozku, ktera se odesila s souborem */
		public function removeFormData(dataName:String):void{
			var folder:Object = this.getDataFolder(getActiveId());
			folder.removeFormData(dataName);
		}		
		
		/* vyprazdni data, ktera se maji posilat se souborem */
		public function clearFormData():void{
			var folder:Object = this.getDataFolder(getActiveId());
			var tmpData:Object = folder.getFormData();
			for(var i:String in tmpData){
				folder.removeFormData(i);
			}
		}
		/* vyprazdni data  */
		public function clear():void{
			var folder:Object = this.getDataFolder(getActiveId());
			folder.clear();
		}
		
	}
}
